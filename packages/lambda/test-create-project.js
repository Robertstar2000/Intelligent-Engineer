// Test script to debug project creation
const https = require('https');

const API_URL = 'https://imuoni3n40.execute-api.us-east-1.amazonaws.com/dev/projects';

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.error('Usage: node test-create-project.js <JWT_TOKEN>');
  process.exit(1);
}

const projectData = {
  name: 'Test Project',
  description: 'Test Description',
  requirements: 'Test Requirements',
  constraints: 'Test Constraints',
  disciplines: ['Software Engineering'],
  developmentMode: 'rapid'
};

console.log('Testing project creation with data:', JSON.stringify(projectData, null, 2));

const data = JSON.stringify(projectData);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': data.length
  }
};

const req = https.request(API_URL, options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:', body);
    try {
      const parsed = JSON.parse(body);
      console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
