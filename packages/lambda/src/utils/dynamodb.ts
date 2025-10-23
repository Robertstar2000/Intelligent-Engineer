import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'intelligent-engineering-platform-dev';

export const getTableName = (tableName: string): string => {
  return `${TABLE_PREFIX}-${tableName}`;
};

export class DynamoDBService {
  async get(tableName: string, key: Record<string, any>) {
    const command = new GetCommand({
      TableName: getTableName(tableName),
      Key: key,
    });
    const response = await docClient.send(command);
    return response.Item;
  }

  async put(tableName: string, item: Record<string, any>) {
    const command = new PutCommand({
      TableName: getTableName(tableName),
      Item: item,
    });
    await docClient.send(command);
    return item;
  }

  async update(tableName: string, key: Record<string, any>, updates: Record<string, any>) {
    const updateExpression = Object.keys(updates)
      .map((k, i) => `#attr${i} = :val${i}`)
      .join(', ');
    
    const expressionAttributeNames = Object.keys(updates).reduce((acc, k, i) => {
      acc[`#attr${i}`] = k;
      return acc;
    }, {} as Record<string, string>);
    
    const expressionAttributeValues = Object.keys(updates).reduce((acc, k, i) => {
      acc[`:val${i}`] = updates[k];
      return acc;
    }, {} as Record<string, any>);

    const command = new UpdateCommand({
      TableName: getTableName(tableName),
      Key: key,
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes;
  }

  async delete(tableName: string, key: Record<string, any>) {
    const command = new DeleteCommand({
      TableName: getTableName(tableName),
      Key: key,
    });
    await docClient.send(command);
  }

  async query(tableName: string, indexName: string | undefined, keyCondition: string, expressionAttributeValues: Record<string, any>) {
    const command = new QueryCommand({
      TableName: getTableName(tableName),
      IndexName: indexName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }

  async scan(tableName: string, filterExpression?: string, expressionAttributeValues?: Record<string, any>) {
    const command = new ScanCommand({
      TableName: getTableName(tableName),
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }
}

export const db = new DynamoDBService();
