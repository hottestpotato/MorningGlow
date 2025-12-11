const http = require('http');

// Test /health endpoint
http.get('http://localhost:3001/health', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('✅ Health check successful!');
    console.log('Response:', data);
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
