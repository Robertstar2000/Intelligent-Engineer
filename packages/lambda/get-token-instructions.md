# How to Get Your JWT Token for Testing

1. Open your browser to: http://intelligent-engineering-platform-frontend.s3-website-us-east-1.amazonaws.com
2. Log in with your credentials
3. Open Developer Console (F12)
4. Go to Console tab
5. Type: `localStorage.getItem('token')`
6. Copy the token value (without quotes)
7. Run: `node test-create-project.js YOUR_TOKEN_HERE`

This will test the project creation endpoint directly and show us the exact validation error.
