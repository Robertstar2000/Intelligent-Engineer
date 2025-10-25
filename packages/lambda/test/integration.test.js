// Integration tests for Lambda functions
const https = require('https');

const API_BASE = 'https://imuoni3n40.execute-api.us-east-1.amazonaws.com/dev';

// Test utilities
function makeRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const body = data ? JSON.stringify(data) : null;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(url, options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('🧪 Starting Backend Integration Tests\n');
  
  let testToken = null;
  let testUserId = null;
  let testProjectId = null;
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, message) {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (message) console.log(`   ${message}`);
    results.tests.push({ name, passed, message });
    if (passed) results.passed++;
    else results.failed++;
  }

  // Test 1: Register new user
  try {
    const timestamp = Date.now();
    const response = await makeRequest('/auth/register', 'POST', {
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'TestPass123!'
    });
    
    if (response.status === 201 && response.data.token) {
      testToken = response.data.token;
      testUserId = response.data.user.id;
      logTest('User Registration', true, `User created with ID: ${testUserId}`);
    } else {
      logTest('User Registration', false, `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logTest('User Registration', false, error.message);
  }

  // Test 2: Login with existing user
  try {
    const response = await makeRequest('/auth/login', 'POST', {
      email: 'Robertstar@aol.com',
      password: 'Rm2214ri#'
    });
    
    if (response.status === 200 && response.data.token) {
      testToken = response.data.token;
      logTest('User Login', true, 'Login successful');
    } else {
      logTest('User Login', false, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('User Login', false, error.message);
  }

  // Test 3: Get current user
  if (testToken) {
    try {
      const response = await makeRequest('/auth/me', 'GET', null, testToken);
      
      if (response.status === 200 && response.data.id) {
        logTest('Get Current User', true, `User ID: ${response.data.id}`);
      } else {
        logTest('Get Current User', false, `Status: ${response.status}`);
      }
    } catch (error) {
      logTest('Get Current User', false, error.message);
    }
  } else {
    logTest('Get Current User', false, 'No token available');
  }

  // Test 4: Create project
  if (testToken) {
    try {
      const response = await makeRequest('/projects', 'POST', {
        name: 'Test Project',
        description: 'Test Description',
        requirements: 'Test Requirements',
        constraints: 'Test Constraints',
        disciplines: ['Software Engineering'],
        developmentMode: 'rapid'
      }, testToken);
      
      if (response.status === 201 && response.data.id) {
        testProjectId = response.data.id;
        logTest('Create Project', true, `Project created with ID: ${testProjectId}`);
      } else {
        logTest('Create Project', false, `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      logTest('Create Project', false, error.message);
    }
  } else {
    logTest('Create Project', false, 'No token available');
  }

  // Test 5: List projects
  if (testToken) {
    try {
      const response = await makeRequest('/projects', 'GET', null, testToken);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        logTest('List Projects', true, `Found ${response.data.length} projects`);
      } else {
        logTest('List Projects', false, `Status: ${response.status}`);
      }
    } catch (error) {
      logTest('List Projects', false, error.message);
    }
  } else {
    logTest('List Projects', false, 'No token available');
  }

  // Test 6: Get specific project
  if (testToken && testProjectId) {
    try {
      const response = await makeRequest(`/projects/${testProjectId}`, 'GET', null, testToken);
      
      if (response.status === 200 && response.data.id === testProjectId) {
        logTest('Get Project', true, `Retrieved project: ${response.data.name}`);
      } else {
        logTest('Get Project', false, `Status: ${response.status}`);
      }
    } catch (error) {
      logTest('Get Project', false, error.message);
    }
  } else {
    logTest('Get Project', false, 'No token or project ID available');
  }

  // Test 7: Unauthorized access (no token)
  try {
    const response = await makeRequest('/projects', 'GET', null, null);
    
    if (response.status === 401 || response.status === 403) {
      logTest('Unauthorized Access Protection', true, 'Correctly rejected unauthorized request');
    } else {
      logTest('Unauthorized Access Protection', false, `Expected 401/403, got ${response.status}`);
    }
  } catch (error) {
    logTest('Unauthorized Access Protection', false, error.message);
  }

  // Test 8: Invalid token
  try {
    const response = await makeRequest('/projects', 'GET', null, 'invalid-token-12345');
    
    if (response.status === 401 || response.status === 403) {
      logTest('Invalid Token Protection', true, 'Correctly rejected invalid token');
    } else {
      logTest('Invalid Token Protection', false, `Expected 401/403, got ${response.status}`);
    }
  } catch (error) {
    logTest('Invalid Token Protection', false, error.message);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
