const fs = require('fs');
const http = require('http');
const path = require('path');

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Usage: node upload_and_analyze.js <image-path>');
  process.exit(2);
}

const resolvedPath = path.resolve(fileArg);
if (!fs.existsSync(resolvedPath)) {
  console.error('File not found:', resolvedPath);
  process.exit(1);
}

const buffer = fs.readFileSync(resolvedPath);
const mime = (() => {
  const ext = path.extname(resolvedPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
})();

const base64 = `data:${mime};base64,` + buffer.toString('base64');
const payload = JSON.stringify({ base64Image: base64 });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(payload);
req.end();
