const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getStatusForRole, canUserApprove } = require('../src/services/workflowService');

console.log('--- Starting Backend Unit Tests ---');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. Password Hashing Tests
it('bcryptjs should reliably hash and verify passwords', () => {
  const password = 'TestSecretPassword@123';
  const hash = bcrypt.hashSync(password, 10);
  assert(bcrypt.compareSync(password, hash), 'Password comparison should succeed');
  assert(!bcrypt.compareSync('WrongPassword', hash), 'Incorrect password comparison should fail');
});

// 2. JWT Generation & Verification Tests
it('JWT signing and payload verification should work accurately', () => {
  const secret = 'test_secret_key_123';
  const payload = { id: 42, role: 'student', email: 'test@college.edu' };
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  const decoded = jwt.verify(token, secret);
  assert.strictEqual(decoded.id, 42);
  assert.strictEqual(decoded.role, 'student');
  assert.strictEqual(decoded.email, 'test@college.edu');
});

// 3. Workflow State Mapping Tests
it('getStatusForRole maps roles to appropriate workflow statuses', () => {
  assert.strictEqual(getStatusForRole('faculty'), 'Under Department Review');
  assert.strictEqual(getStatusForRole('hod'), 'Pending HOD Approval');
  assert.strictEqual(getStatusForRole('academic_office'), 'Pending Academic Office Verification');
});

// 4. Role-based Workflow Authorization Matrix Tests
it('canUserApprove grants access to correct department faculty', () => {
  const facultyUser = { id: 2, role: 'faculty', department_id: 1 };
  const requestInDept1 = { id: 10, department_id: 1 };
  const facultyStage = { id: 1, approver_role: 'faculty', department_required: 1 };

  assert.strictEqual(canUserApprove(facultyUser, requestInDept1, facultyStage), true);
});

it('canUserApprove denies faculty from another department', () => {
  const facultyUserDept2 = { id: 3, role: 'faculty', department_id: 2 };
  const requestInDept1 = { id: 10, department_id: 1 };
  const facultyStage = { id: 1, approver_role: 'faculty', department_required: 1 };

  assert.strictEqual(canUserApprove(facultyUserDept2, requestInDept1, facultyStage), false);
});

it('canUserApprove strictly blocks students from approving', () => {
  const studentUser = { id: 6, role: 'student', department_id: 1 };
  const requestInDept1 = { id: 10, department_id: 1 };
  const facultyStage = { id: 1, approver_role: 'faculty', department_required: 1 };

  assert.strictEqual(canUserApprove(studentUser, requestInDept1, facultyStage), false);
});

it('canUserApprove allows admin override on any stage', () => {
  const adminUser = { id: 1, role: 'admin', department_id: null };
  const request = { id: 10, department_id: 1 };
  const stage = { id: 2, approver_role: 'hod', department_required: 1 };

  assert.strictEqual(canUserApprove(adminUser, request, stage), true);
});

it('canUserApprove authorizes academic office across all departments', () => {
  const officeUser = { id: 5, role: 'academic_office', department_id: null };
  const requestInDept3 = { id: 15, department_id: 3 };
  const officeStage = { id: 3, approver_role: 'academic_office', department_required: 0 };

  assert.strictEqual(canUserApprove(officeUser, requestInDept3, officeStage), true);
});

console.log(`\nTest Summary: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
