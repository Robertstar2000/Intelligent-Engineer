// Seed initial user into DynamoDB
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'intelligent-engineering-platform-dev-users';

async function seedUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Rm2214ri#', 10);

    const user = {
      id: uuidv4(),
      name: 'BobM',
      email: 'Robertstar@aol.com',
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
    });

    await docClient.send(command);

    console.log('✅ User created successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Password: Rm2214ri#');
    console.log('\nYou can now login with these credentials.');
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

seedUser();
