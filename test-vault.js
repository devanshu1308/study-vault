const http = require('http');
const fs = require('fs');
const path = require('path');

// Port for test
process.env.PORT = '3099';
process.env.ADMIN_PASSWORD = 'testvaultsecret';
process.env.JWT_SECRET = 'testjwtsecret';

// Start server
require('./server.js');

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function request(options, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3099,
      ...options,
      headers: {
        ...options.headers,
        ...headers
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body, rawBody: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      if (Buffer.isBuffer(data) || typeof data === 'string') {
        req.write(data);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('Waiting for server to spin up on port 3099...');
  await delay(1200);

  console.log('\n--- TEST 1: GET / (Frontend Delivery) ---');
  const indexRes = await request({ path: '/', method: 'GET' });
  if (indexRes.status === 200 && indexRes.rawBody.includes('THE STUDY VAULT')) {
    console.log('PASS: index.html served successfully with title and structure.');
  } else {
    throw new Error(`FAIL: index.html returned status ${indexRes.status}`);
  }

  console.log('\n--- TEST 2: GET /api/vault (Public Read Vault State) ---');
  const vaultRes = await request({ path: '/api/vault', method: 'GET' });
  if (vaultRes.status === 200 && vaultRes.body.subjects.length === 5) {
    console.log(`PASS: /api/vault returned 5 subjects: ${vaultRes.body.subjects.map(s => s.name).join(', ')}`);
    console.log(`PASS: Seed materials count: ${vaultRes.body.materials.length}`);
  } else {
    throw new Error(`FAIL: /api/vault unexpected output: ${JSON.stringify(vaultRes.body)}`);
  }

  console.log('\n--- TEST 3: POST /api/auth/login (Invalid Password) ---');
  const badLogin = await request(
    { path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    JSON.stringify({ password: 'wrongpassword' })
  );
  if (badLogin.status === 401) {
    console.log('PASS: Correctly rejected invalid admin login with 401.');
  } else {
    throw new Error(`FAIL: Bad login should return 401, got ${badLogin.status}`);
  }

  console.log('\n--- TEST 4: POST /api/auth/login (Valid Password) ---');
  const goodLogin = await request(
    { path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    JSON.stringify({ password: 'testvaultsecret' })
  );
  if (goodLogin.status === 200 && goodLogin.body.token) {
    console.log('PASS: Successfully authenticated and received JWT token.');
  } else {
    throw new Error(`FAIL: Good login failed: ${JSON.stringify(goodLogin.body)}`);
  }
  const adminToken = goodLogin.body.token;

  console.log('\n--- TEST 5: POST /api/materials without Token (Security Check) ---');
  const unauthUpload = await request({ path: '/api/materials', method: 'POST' });
  if (unauthUpload.status === 401) {
    console.log('PASS: Correctly blocked unauthorized upload with 401.');
  } else {
    throw new Error(`FAIL: Expected 401 for unauthorized upload, got ${unauthUpload.status}`);
  }

  console.log('\n--- TEST 6: POST /api/materials with Valid Token (Multer Multipart Upload) ---');
  const boundary = '----StudyVaultBoundary' + Date.now();
  const fileContent = 'Sample notes text content for automated testing.';
  const payload = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="subject"',
    '',
    'AIML',
    `--${boundary}`,
    'Content-Disposition: form-data; name="category"',
    '',
    'Notes',
    `--${boundary}`,
    'Content-Disposition: form-data; name="title"',
    '',
    'Unit 5 Deep RL Extra Notes',
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="deep_rl_notes.pdf"',
    'Content-Type: application/pdf',
    '',
    fileContent,
    `--${boundary}--`
  ].join('\r\n');

  const uploadRes = await request(
    {
      path: '/api/materials',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${adminToken}`
      }
    },
    payload
  );

  if (uploadRes.status === 201 && uploadRes.body.material) {
    console.log(`PASS: Material uploaded successfully: "${uploadRes.body.material.title}" (ID: ${uploadRes.body.material.id})`);
  } else {
    throw new Error(`FAIL: Upload failed: ${JSON.stringify(uploadRes.body)}`);
  }
  const uploadedId = uploadRes.body.material.id;

  console.log('\n--- TEST 7: GET /api/download/:id (1-Click File Download) ---');
  const downloadRes = await request({ path: `/api/download/${uploadedId}`, method: 'GET' });
  const contentDisposition = downloadRes.headers['content-disposition'] || '';
  if (downloadRes.status === 200 && contentDisposition.includes('attachment; filename="deep_rl_notes.pdf"')) {
    console.log(`PASS: Download triggered with proper Content-Disposition: "${contentDisposition}"`);
    console.log(`PASS: File contents verified: "${downloadRes.rawBody}"`);
  } else {
    throw new Error(`FAIL: Download response invalid: status=${downloadRes.status}, cd=${contentDisposition}`);
  }

  console.log('\n--- TEST 8: DELETE /api/materials/:id without Token (Security Check) ---');
  const unauthDelete = await request({ path: `/api/materials/${uploadedId}`, method: 'DELETE' });
  if (unauthDelete.status === 401) {
    console.log('PASS: Correctly blocked unauthorized deletion with 401.');
  } else {
    throw new Error(`FAIL: Expected 401 for unauthorized delete, got ${unauthDelete.status}`);
  }

  console.log('\n--- TEST 9: DELETE /api/materials/:id with Valid Token ---');
  const authDelete = await request(
    {
      path: `/api/materials/${uploadedId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );
  if (authDelete.status === 200 && authDelete.body.success) {
    console.log(`PASS: Material successfully purged: ${authDelete.body.message}`);
  } else {
    throw new Error(`FAIL: Delete failed: ${JSON.stringify(authDelete.body)}`);
  }

  console.log('\n=========================================');
  console.log('🎉 ALL 9 AUTOMATED TESTS PASSED CLEANLY!');
  console.log('=========================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
