import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../utils/dynamodb';

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIGenerationOptions {
  prompt: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
  useCache?: boolean;
}

export interface AIResponse {
  content: string;
  engine: 'bedrock' | 'gemini';
  cached: boolean;
  tokensUsed?: number;
  cost?: number;
}

export class DualAIService {
  private bedrockModelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  private geminiModel = 'gemini-2.0-flash-exp';
  private maxRetries = 2;

  /**
   * Generate content using dual-AI strategy
   * Primary: AWS Bedrock (Claude 3.5 Sonnet)
   * Fallback: Google Gemini
   */
  async generateContent(options: AIGenerationOptions): Promise<AIResponse> {
    const { prompt, context, maxTokens = 4096, temperature = 0.7, useCache = true } = options;

    // Check cache first
    if (useCache) {
      const cached = await this.getFromCache(prompt);
      if (cached) {
        console.log('Cache hit for AI generation');
        return {
          content: cached,
          engine: 'bedrock',
          cached: true,
        };
      }
    }

    // Try Bedrock first
    try {
      console.log('Attempting generation with AWS Bedrock (Claude 3.5 Sonnet)');
      const content = await this.generateWithBedrock(prompt, maxTokens, temperature);
      
      // Cache the response
      if (useCache) {
        await this.saveToCache(prompt, content);
      }

      return {
        content,
        engine: 'bedrock',
        cached: false,
        tokensUsed: this.estimateTokens(content),
        cost: this.calculateBedrockCost(prompt, content),
      };
    } catch (error: any) {
      console.error('Bedrock generation failed:', error.message);
      
      // Check if it's a rate limit or service error
      if (this.shouldFallbackToGemini(error)) {
        console.log('Falling back to Google Gemini');
        return await this.generateWithGeminiFallback(prompt, maxTokens, temperature, useCache);
      }
      
      throw error;
    }
  }

  /**
   * Generate content using AWS Bedrock (Claude 3.5 Sonnet)
   */
  private async generateWithBedrock(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: this.bedrockModelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      return responseBody.content[0].text;
    }
    
    throw new Error('Invalid response from Bedrock');
  }

  /**
   * Fallback to Google Gemini
   */
  private async generateWithGeminiFallback(prompt: string, maxTokens: number, temperature: number, useCache: boolean): Promise<AIResponse> {
    try {
      const model = geminiClient.getGenerativeModel({ model: this.geminiModel });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      });

      const content = result.response.text();
      
      // Cache the response
      if (useCache) {
        await this.saveToCache(prompt, content);
      }

      return {
        content,
        engine: 'gemini',
        cached: false,
        tokensUsed: this.estimateTokens(content),
        cost: this.calculateGeminiCost(prompt, content),
      };
    } catch (error: any) {
      console.error('Gemini fallback also failed:', error.message);
      throw new Error('Both AI engines failed. Please try again later.');
    }
  }

  /**
   * Determine if we should fallback to Gemini
   */
  private shouldFallbackToGemini(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Rate limit errors
    if (errorMessage.includes('throttl') || errorMessage.includes('rate limit') || errorCode === 'ThrottlingException') {
      return true;
    }

    // Service unavailable
    if (errorMessage.includes('service unavailable') || errorCode === 'ServiceUnavailableException') {
      return true;
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorCode === 'TimeoutError') {
      return true;
    }

    return false;
  }

  /**
   * Get cached AI response
   */
  private async getFromCache(prompt: string): Promise<string | null> {
    try {
      const cacheKey = this.generateCacheKey(prompt);
      const cached = await db.get('ai-cache', { cacheKey });
      
      if (cached && cached.content) {
        // Check if cache is still valid (TTL handled by DynamoDB)
        return cached.content;
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }
    
    return null;
  }

  /**
   * Save AI response to cache
   */
  private async saveToCache(prompt: string, content: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(prompt);
      const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

      await db.put('ai-cache', {
        cacheKey,
        content,
        ttl,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }

  /**
   * Generate cache key from prompt
   */
  private generateCacheKey(prompt: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate Bedrock cost (Claude 3.5 Sonnet pricing)
   */
  private calculateBedrockCost(prompt: string, response: string): number {
    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = this.estimateTokens(response);
    
    // Claude 3.5 Sonnet pricing (as of 2024)
    // Input: $0.003 per 1K tokens
    // Output: $0.015 per 1K tokens
    const inputCost = (inputTokens / 1000) * 0.003;
    const outputCost = (outputTokens / 1000) * 0.015;
    
    return inputCost + outputCost;
  }

  /**
   * Calculate Gemini cost
   */
  private calculateGeminiCost(prompt: string, response: string): number {
    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = this.estimateTokens(response);
    
    // Gemini 2.0 Flash pricing (free tier, then paid)
    // Assuming paid tier: $0.00015 per 1K input tokens, $0.0006 per 1K output tokens
    const inputCost = (inputTokens / 1000) * 0.00015;
    const outputCost = (outputTokens / 1000) * 0.0006;
    
    return inputCost + outputCost;
  }

  /**
   * Get AI engine health status
   */
  async getEngineHealth(): Promise<{ bedrock: boolean; gemini: boolean }> {
    const health = {
      bedrock: false,
      gemini: false,
    };

    // Test Bedrock
    try {
      await this.generateWithBedrock('Test', 10, 0.5);
      health.bedrock = true;
    } catch (error) {
      console.error('Bedrock health check failed');
    }

    // Test Gemini
    try {
      const model = geminiClient.getGenerativeModel({ model: this.geminiModel });
      await model.generateContent('Test');
      health.gemini = true;
    } catch (error) {
      console.error('Gemini health check failed');
    }

    return health;
  }
}

export const aiService = new DualAIService();
