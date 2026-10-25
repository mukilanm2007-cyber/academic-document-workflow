const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('../src/app');

// Quick integration test using node http or supertest-like fetch
async function runIntegrationTests() {
  console.log('--- Starting Full-Stack End-to-End Workflow Integration Tests ---');
  let passed = 0;
  let failed = 0;

  let server;
  const PORT = 5055;
  const BASE_URL = `http://127.0.0.1:${PORT}/api`;

  try {
    server = await new Promise((resolve) => {
      const s = app.listen(PORT, '127.0.0.1', () => resolve(s));
    });

    const request = async (endpoint, options = {}) => {
      const url = `${BASE_URL}${endpoint}`;
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      const res = await fetch(url, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      return { status: res.status, headers: res.headers, data };
    };

    // Test 1: Health check
    {
      const res = await request('/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'online');
      console.log('[PASS] API Health Check endpoint active');
      passed++;
    }

    // Test 2: Student Login
    let studentToken, studentUser;
    {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'student1@college.edu', password: 'Student@123' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert(res.data.token, 'Token must be present');
      studentToken = res.data.token;
      studentUser = res.data.user;
      assert.strictEqual(studentUser.role, 'student');
      console.log(`[PASS] Student login successful: ${studentUser.name} (${studentUser.registration_number})`);
      passed++;
    }

    // Test 3: Faculty Login
    let facultyToken;
    {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'faculty.cs@college.edu', password: 'Faculty@123' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.role, 'faculty');
      facultyToken = res.data.token;
      console.log(`[PASS] Faculty login successful: ${res.data.user.name}`);
      passed++;
    }

    // Test 4: HOD Login
    let hodToken;
    {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'hod.cs@college.edu', password: 'Hod@123' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.role, 'hod');
      hodToken = res.data.token;
      console.log(`[PASS] HOD login successful: ${res.data.user.name}`);
      passed++;
    }

    // Test 5: Academic Office Login
    let officeToken;
    {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'academic.office@college.edu', password: 'Office@123' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.role, 'academic_office');
      officeToken = res.data.token;
      console.log(`[PASS] Academic Office login successful: ${res.data.user.name}`);
      passed++;
    }

    // Test 6: Student Submits New Document Request (Bona Fide)
    let newRequestId, newRefNumber;
    {
      const res = await request('/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({
          document_type_id: 1, // Bona Fide Certificate
          purpose: 'Official application for National Science Talent Scholarship 2026',
          additional_details: 'Hostel Resident block B room 104'
        })
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert(res.data.referenceNumber.startsWith('REQ-'), 'Reference number should start with REQ-');
      newRequestId = res.data.requestId;
      newRefNumber = res.data.referenceNumber;
      console.log(`[PASS] Student created request ${newRefNumber} (ID: ${newRequestId})`);
      passed++;
    }

    // Test 7: Faculty Reviews and Approves Stage 1
    {
      const res = await request(`/approvals/${newRequestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${facultyToken}` },
        body: JSON.stringify({ comments: 'Verified academic attendance and laboratory credits. Recommended.' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.status, 'Pending HOD Approval');
      console.log('[PASS] Faculty approved stage 1 -> advanced to Pending HOD Approval');
      passed++;
    }

    // Test 8: HOD Reviews and Approves Stage 2
    {
      const res = await request(`/approvals/${newRequestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${hodToken}` },
        body: JSON.stringify({ comments: 'HOD endorsement granted for National Scholarship.' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.status, 'Pending Academic Office Verification');
      console.log('[PASS] HOD approved stage 2 -> advanced to Pending Academic Office Verification');
      passed++;
    }

    // Test 9: Academic Office Signs Off Stage 3 (Final Stage -> Auto PDF Generation)
    {
      const res = await request(`/approvals/${newRequestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${officeToken}` },
        body: JSON.stringify({ comments: 'Registrar authentication verified. Official document stamped.' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.status, 'Document Issued');
      assert.strictEqual(res.data.isFinal, true);
      assert(res.data.documentNumber, 'Document number must be generated');
      console.log(`[PASS] Academic Office final approval -> Document Issued (${res.data.documentNumber})`);
      passed++;
    }

    // Test 10: Student Securely Downloads Generated Official PDF
    {
      const res = await request(`/documents/${newRequestId}/download`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
      assert(res.data.startsWith('%PDF'), 'Downloaded content must start with PDF header %PDF');
      console.log('[PASS] Student downloaded genuine issued PDF certificate');
      passed++;
    }

    // Test 11: Admin Dashboard and CSV Report Export
    {
      const adminLogin = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' })
      });
      const adminToken = adminLogin.data.token;

      const statsRes = await request('/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(statsRes.status, 200);
      assert(statsRes.data.stats.total_requests >= 7);
      console.log(`[PASS] Admin dashboard stats loaded (${statsRes.data.stats.total_requests} total requests)`);
      passed++;

      const csvRes = await request('/admin/reports?format=csv', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(csvRes.status, 200);
      assert(csvRes.headers.get('content-type').includes('text/csv'));
      assert(csvRes.data.includes('Reference Number,Student Name,Registration No'), 'CSV must contain headers');
      console.log('[PASS] Admin CSV report generated and downloaded successfully');
      passed++;
    }

    // Test 12: Public Certificate Verification
    {
      const verifyRes = await request(`/public/verify/DOC-BON-2026-0001`);
      assert.strictEqual(verifyRes.status, 200);
      assert.strictEqual(verifyRes.data.verified, true);
      assert.strictEqual(verifyRes.data.certificate.student_name, 'Aarav Patel');
      console.log('[PASS] Public certificate verification succeeded for DOC-BON-2026-0001');
      passed++;
    }

    console.log(`\n🎉 ALL ${passed} INTEGRATION TESTS PASSED WITH 0 FAILURES!\n`);
  } catch (error) {
    console.error('Integration test failure:', error);
    failed++;
  } finally {
    if (server) server.close();
    if (failed > 0) process.exit(1);
    process.exit(0);
  }
}

runIntegrationTests();
