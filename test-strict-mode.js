import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a minimal PNG (1x1 white pixel)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

console.log('Test: /api/analyze with strict mode');
console.log('===================================\n');
console.log('Strict Mode Status:');
console.log('- AI_DETECTION_STRICT=true');
console.log('- AI_ALLOW_MOCK_FALLBACK=false');
console.log('- AI_API_KEY=configured');
console.log('\n');

// Make the request
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);

const body = [];
body.push('--' + boundary);
body.push('Content-Disposition: form-data; name="image"; filename="test.png"');
body.push('Content-Type: image/png');
body.push('');
body.push(pngBuffer); // This won't work as string, need binary
body.push('--' + boundary + '--');

// Better approach: build binary body
const parts = [];
parts.push(Buffer.from('--' + boundary + '\r\n'));
parts.push(Buffer.from('Content-Disposition: form-data; name="image"; filename="test.png"\r\n'));
parts.push(Buffer.from('Content-Type: image/png\r\n\r\n'));
parts.push(pngBuffer);
parts.push(Buffer.from('\r\n--' + boundary + '--\r\n'));

const bodyBuffer = Buffer.concat(parts);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length
  }
};

console.log('Sending POST /api/analyze with minimal PNG...\n');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Status:', res.statusCode, res.statusMessage);
    console.log('Response Headers:', res.headers);
    console.log('\n');
    
    try {
      const response = JSON.parse(data);
      
      // Check for detection source
      const metadata = response.__metadata || {};
      const detectionSource = metadata.detectionSource;
      
      console.log('DETECTION RESULTS:');
      console.log('==================');
      console.log('Status Code:', response.statusCode);
      console.log('Detection Source:', detectionSource);
      
      if (detectionSource === 'groq') {
        console.log('✅ SUCCESS: Using Groq API (not mock fallback)');
      } else if (detectionSource === 'mock') {
        console.log('❌ FAIL: Using mock data (fallback should be disabled in strict mode)');
      } else {
        console.log('⚠️  Unknown detection source:', detectionSource);
      }
      
      if (response.components) {
        console.log(`\nDetected ${response.components.length} components`);
      }
      
      console.log('\nFull metadata:', JSON.stringify(metadata, null, 2));
      
    } catch (e) {
      console.log('ERROR: Could not parse response as JSON');
      console.log('Raw response (first 500 chars):');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.write(bodyBuffer);
req.end();

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Request timeout');
  process.exit(1);
}, 10000);
