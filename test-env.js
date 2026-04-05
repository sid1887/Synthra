import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

console.log('=== Environment Check ===');
console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
console.log('AI_VISION_MODEL:', process.env.AI_VISION_MODEL);
console.log('AI_DETECTION_STRICT:', process.env.AI_DETECTION_STRICT);
console.log('AI_ALLOW_MOCK_FALLBACK:', process.env.AI_ALLOW_MOCK_FALLBACK);
console.log('AI_API_KEY set:', !!process.env.AI_API_KEY);
console.log('AI_API_KEY length:', process.env.AI_API_KEY?.length);

// Test health endpoint
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health/modules',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n=== Health Check ===');
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Component Detection:', JSON.stringify(json.componentDetection, null, 2));
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Health check error:', e.message);
});

req.end();
