import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response';
import { db } from '../utils/dynamodb';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors);
    }

    const { email, password } = validation.data;

    // Find user by email
    const users = await db.query('users', 'EmailIndex', 'email = :email', {
      ':email': email,
    });

    if (!users || users.length === 0) {
      return errorResponse('Invalid credentials', 401);
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return errorResponse('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await db.update('users', { id: user.id }, {
      lastLogin: new Date().toISOString(),
    });

    return successResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse(error.message || 'Login failed');
  }
};

export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors);
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUsers = await db.query('users', 'EmailIndex', 'email = :email', {
      ':email': email,
    });

    if (existingUsers && existingUsers.length > 0) {
      return errorResponse('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    await db.put('users', user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }, 201);
  } catch (error: any) {
    console.error('Registration error:', error);
    return errorResponse(error.message || 'Registration failed');
  }
};

export const me = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // User ID is set by authorizer
    const userId = event.requestContext.authorizer?.userId;

    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    // Get user from database
    const user = await db.get('users', { id: userId });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return errorResponse(error.message || 'Failed to get user');
  }
};
