// Test if analyzing with strict mode works
import fetch from 'node-fetch';
import fs from 'fs';

const API_URL = 'http://localhost:3000/api/analyze';

// Create a minimal valid PNG (1x1 red pixel)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
const pngBuffer =Buffer.from(pngBase64, 'base64');

// Write to temp file for form upload
const tempFile = '/tmp/test.png';
fs.writeFileSync(tempFile, pngBuffer);

// Create form data
const FormData = (await import('form-data')).default;
const form = new FormData();
form.append('image', fs.createReadStream(tempFile));

console.log('Sending analyze request...');
console.log('Image size:', pngBuffer.length, 'bytes');

try {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });

  const json = await response.json();
  
  console.log('\n=== Analysis Response ===');
  console.log('Status:', response.status);
  console.log('Status Code:', json.statusCode);
  console.log('Status Message:', json.statusMessage);
  console.log('Detection Source:', json.__metadata?.detectionSource || 'unknown');
  console.log('Component Count:', json.components?.length || 0);
  
  if (json.statusCode === 'error') {
    console.log('\n❌ ANALYSIS FAILED');
    console.log('Error:', json.statusMessage);
  } else if (json.__metadata?.detectionSource === 'mock') {
    console.log('\n⚠️  USING MOCK DATA');
    console.log('This means the detector fell back to mock.');
  } else if (json.__metadata?.detectionSource === 'groq') {
    console.log('\n✅ SUCCESS - Real Groq Vision inference!');
  }
} catch (err) {
  console.error('Request error:', err.message);
}
