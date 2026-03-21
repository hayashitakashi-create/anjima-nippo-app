#!/usr/bin/env node
/**
 * E2E Test Script for anjima-nippo-app
 * Tests the complete work report workflow via API calls.
 */

const BASE_URL = 'https://anjima-nippo-app.vercel.app';
const USERNAME = 't-yasujima@yasujimakougyou.co.jp';
const PASSWORDS_TO_TRY = ['00000000'];

let authCookie = '';
let passed = 0;
let failed = 0;
let createdReportId = '';
let bulkReportIds = [];

// ============================================================
// Helpers
// ============================================================

function log(status, testName, detail = '') {
  const icon = status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  [${icon}] ${testName}${detail ? ' — ' + detail : ''}`);
  if (status === 'PASS') passed++;
  else failed++;
}

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authCookie ? { Cookie: authCookie } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers, redirect: 'manual' });
  let body;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, headers: res.headers, body, ok: res.ok };
}

// ============================================================
// Tests
// ============================================================

async function testLogin() {
  console.log('\n--- Test 1: Login ---');
  for (const pw of PASSWORDS_TO_TRY) {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: USERNAME, password: pw }),
    });

    if (res.status === 200 && res.body?.user) {
      // Extract set-cookie headers
      const setCookieHeaders = res.headers.getSetCookie?.() || [];
      const cookies = [];
      for (const sc of setCookieHeaders) {
        const cookiePart = sc.split(';')[0];
        cookies.push(cookiePart);
      }
      authCookie = cookies.join('; ');
      log('PASS', 'Login', `user=${res.body.user.name}, role=${res.body.user.role}, password="${pw}"`);
      return true;
    }
  }
  log('FAIL', 'Login', 'All passwords failed');
  return false;
}

async function testGetProjects() {
  console.log('\n--- Test 2: Get Projects ---');
  const res = await apiFetch('/api/projects?status=active');
  if (res.status === 200 && Array.isArray(res.body)) {
    log('PASS', 'Get projects', `returned ${res.body.length} projects`);
    if (res.body.length > 0) {
      console.log(`         First project: "${res.body[0].name}" (${res.body[0].projectType || 'no type'})`);
    }
  } else {
    log('FAIL', 'Get projects', `status=${res.status}, body=${JSON.stringify(res.body).substring(0, 200)}`);
  }
}

async function testCreateSingleReport() {
  console.log('\n--- Test 3: Create Single Work Report ---');
  const payload = {
    date: '2026-03-20',
    projectName: '山田ビル塗装工事',
    projectType: '建築塗装工事',
    weather: '晴れ',
    contactNotes: 'テスト連絡事項',
    workerRecords: [
      {
        name: '古藤　英紀',
        startTime: '08:00',
        endTime: '17:00',
        workHours: 1.0,
        workType: '建築塗装工事',
        details: '外壁塗装',
        order: 0,
      },
    ],
    materialRecords: [
      {
        name: 'キクテック キクスイライン KL-115 白',
        volume: '20',
        volumeUnit: 'ℓ',
        quantity: 5,
        unitPrice: 3000,
        amount: 15000,
        order: 0,
      },
    ],
    subcontractorRecords: [
      {
        name: 'キョウワビルト工業',
        workerCount: 3,
        workContent: '足場組立',
        order: 0,
      },
    ],
    remoteDepartureTime: '07:00',
    remoteArrivalTime: '08:00',
    remoteDepartureTime2: '17:00',
    remoteArrivalTime2: '18:00',
    trafficGuardCount: 2,
    trafficGuardStart: '08:00',
    trafficGuardEnd: '17:00',
  };

  const res = await apiFetch('/api/work-report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status === 201 && res.body?.id) {
    createdReportId = res.body.id;
    log('PASS', 'Create single report', `id=${createdReportId}`);
    // Quick field checks
    const checks = [
      res.body.projectName === '山田ビル塗装工事',
      res.body.weather === '晴れ',
      res.body.workerRecords?.length === 1,
      res.body.materialRecords?.length === 1,
      res.body.subcontractorRecords?.length === 1,
    ];
    if (checks.every(Boolean)) {
      log('PASS', 'Create single report - field validation', 'all fields match');
    } else {
      log('FAIL', 'Create single report - field validation', `checks=${checks}`);
    }
  } else {
    log('FAIL', 'Create single report', `status=${res.status}, body=${JSON.stringify(res.body).substring(0, 300)}`);
  }
}

async function testGetCreatedReport() {
  console.log('\n--- Test 4: Get Created Report ---');
  if (!createdReportId) {
    log('FAIL', 'Get created report', 'No report ID from previous test');
    return;
  }

  const res = await apiFetch(`/api/work-report/${createdReportId}`);

  if (res.status === 200 && res.body?.id === createdReportId) {
    const b = res.body;
    const checks = {
      projectName: b.projectName === '山田ビル塗装工事',
      projectType: b.projectType === '建築塗装工事',
      weather: b.weather === '晴れ',
      contactNotes: b.contactNotes === 'テスト連絡事項',
      workerName: b.workerRecords?.[0]?.name === '古藤　英紀',
      workerWorkType: b.workerRecords?.[0]?.workType === '建築塗装工事',
      workerDetails: b.workerRecords?.[0]?.details === '外壁塗装',
      materialName: b.materialRecords?.[0]?.name === 'キクテック キクスイライン KL-115 白',
      materialQuantity: b.materialRecords?.[0]?.quantity === 5,
      subName: b.subcontractorRecords?.[0]?.name === 'キョウワビルト工業',
      subWorkerCount: b.subcontractorRecords?.[0]?.workerCount === 3,
      remoteDeparture: b.remoteDepartureTime === '07:00',
      remoteArrival: b.remoteArrivalTime === '08:00',
      remoteDeparture2: b.remoteDepartureTime2 === '17:00',
      remoteArrival2: b.remoteArrivalTime2 === '18:00',
      trafficCount: b.trafficGuardCount === 2,
      trafficStart: b.trafficGuardStart === '08:00',
      trafficEnd: b.trafficGuardEnd === '17:00',
    };

    const failedChecks = Object.entries(checks).filter(([, v]) => !v);
    if (failedChecks.length === 0) {
      log('PASS', 'Get created report', 'all 18 field checks passed');
    } else {
      log('FAIL', 'Get created report', `failed checks: ${failedChecks.map(([k]) => k).join(', ')}`);
      for (const [k] of failedChecks) {
        console.log(`         ${k}: expected match, got field value from response`);
      }
    }
  } else {
    log('FAIL', 'Get created report', `status=${res.status}, body=${JSON.stringify(res.body).substring(0, 300)}`);
  }
}

async function testBulkCreate() {
  console.log('\n--- Test 5: Bulk Create ---');
  const payload = {
    dates: ['2026-03-21', '2026-03-22', '2026-03-23'],
    template: {
      projectName: '山田ビル塗装工事',
      projectType: '建築塗装工事',
      contactNotes: '一括テスト連絡事項',
      remoteDepartureTime: '07:00',
      remoteArrivalTime: '08:00',
      remoteDepartureTime2: '17:00',
      remoteArrivalTime2: '18:00',
      trafficGuardCount: 2,
      trafficGuardStart: '08:00',
      trafficGuardEnd: '17:00',
      workerRecords: [
        {
          name: '古藤　英紀',
          startTime: '08:00',
          endTime: '17:00',
          workHours: 1.0,
          workType: '建築塗装工事',
          details: '外壁塗装',
        },
      ],
      materialRecords: [
        {
          name: 'キクテック キクスイライン KL-115 白',
          volume: '20',
          volumeUnit: 'ℓ',
          quantity: 5,
          unitPrice: 3000,
          amount: 15000,
        },
      ],
      subcontractorRecords: [
        {
          name: 'キョウワビルト工業',
          workerCount: 3,
          workContent: '足場組立',
        },
      ],
    },
  };

  const res = await apiFetch('/api/work-reports/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status === 200 && res.body?.createdCount === 3) {
    bulkReportIds = res.body.createdReports.map((r) => r.id);
    log('PASS', 'Bulk create', `createdCount=${res.body.createdCount}, ids=${bulkReportIds.join(', ')}`);
  } else {
    log('FAIL', 'Bulk create', `status=${res.status}, body=${JSON.stringify(res.body).substring(0, 300)}`);
  }
}

async function testBulkExists() {
  console.log('\n--- Test 6: Check Bulk Exists ---');
  const res = await apiFetch('/api/work-reports/bulk?startDate=2026-03-21&endDate=2026-03-23');

  if (res.status === 200 && res.body?.reports?.length === 3) {
    log('PASS', 'Bulk exists check', `found ${res.body.reports.length} reports`);
    for (const r of res.body.reports) {
      console.log(`         date=${r.date}, project="${r.projectName}"`);
    }
  } else {
    log('FAIL', 'Bulk exists check', `status=${res.status}, count=${res.body?.reports?.length}, body=${JSON.stringify(res.body).substring(0, 300)}`);
  }
}

async function testGetBulkReport() {
  console.log('\n--- Test 7: Get One Bulk Report ---');
  if (bulkReportIds.length === 0) {
    log('FAIL', 'Get bulk report', 'No bulk report IDs from previous test');
    return;
  }

  const reportId = bulkReportIds[0];
  const res = await apiFetch(`/api/work-report/${reportId}`);

  if (res.status === 200 && res.body?.id === reportId) {
    const b = res.body;
    const hasWorkers = b.workerRecords?.length > 0;
    const hasMaterials = b.materialRecords?.length > 0;
    const hasSubs = b.subcontractorRecords?.length > 0;
    const projectMatch = b.projectName === '山田ビル塗装工事';

    if (hasWorkers && hasMaterials && hasSubs && projectMatch) {
      log('PASS', 'Get bulk report', `worker=${b.workerRecords[0].name}, material=${b.materialRecords[0].name}, sub=${b.subcontractorRecords[0].name}`);
    } else {
      log('FAIL', 'Get bulk report', `workers=${hasWorkers}, materials=${hasMaterials}, subs=${hasSubs}, project=${projectMatch}`);
    }
  } else {
    log('FAIL', 'Get bulk report', `status=${res.status}, body=${JSON.stringify(res.body).substring(0, 300)}`);
  }
}

async function testGetMaterials() {
  console.log('\n--- Test 8: Get Materials Master ---');
  const res = await apiFetch('/api/admin/materials');

  if (res.status === 200 && Array.isArray(res.body?.materials)) {
    log('PASS', 'Get materials', `returned ${res.body.materials.length} materials`);
    if (res.body.materials.length > 0) {
      console.log(`         First material: "${res.body.materials[0].name}"`);
    }
  } else {
    log('FAIL', 'Get materials', `status=${res.status}, body=${JSON.stringify(res.body).substring(0, 300)}`);
  }
}

async function testDuplicateDateRejection() {
  console.log('\n--- Test 9: Duplicate Date Rejection ---');
  const payload = {
    dates: ['2026-03-21'],
    template: {
      projectName: '山田ビル塗装工事',
      workerRecords: [],
      materialRecords: [],
      subcontractorRecords: [],
    },
  };

  const res = await apiFetch('/api/work-reports/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status === 400 && res.body?.error) {
    log('PASS', 'Duplicate date rejection', `error="${res.body.error}", existingDates=${JSON.stringify(res.body.existingDates)}`);
  } else {
    log('FAIL', 'Duplicate date rejection', `expected 400, got status=${res.status}, body=${JSON.stringify(res.body).substring(0, 300)}`);
  }
}

async function testUpdateReport() {
  console.log('\n--- Test 10: Update Report ---');
  if (!createdReportId) {
    log('FAIL', 'Update report', 'No report ID from previous test');
    return;
  }

  // First, get the current report to have full data for the PUT
  const getRes = await apiFetch(`/api/work-report/${createdReportId}`);
  if (getRes.status !== 200) {
    log('FAIL', 'Update report', `Could not fetch report: status=${getRes.status}`);
    return;
  }

  const current = getRes.body;
  const payload = {
    date: current.date,
    projectName: current.projectName,
    projectType: current.projectType,
    weather: '曇り',
    contactNotes: '更新されたテスト連絡事項',
    remoteDepartureTime: current.remoteDepartureTime,
    remoteArrivalTime: current.remoteArrivalTime,
    remoteDepartureTime2: current.remoteDepartureTime2,
    remoteArrivalTime2: current.remoteArrivalTime2,
    trafficGuardCount: current.trafficGuardCount,
    trafficGuardStart: current.trafficGuardStart,
    trafficGuardEnd: current.trafficGuardEnd,
    workerRecords: current.workerRecords.map((w) => ({
      name: w.name,
      startTime: w.startTime,
      endTime: w.endTime,
      workHours: w.workHours,
      workType: w.workType,
      details: w.details,
      dailyHours: w.dailyHours,
      totalHours: w.totalHours,
      remainHours: w.remainHours,
      order: w.order,
    })),
    materialRecords: current.materialRecords.map((m) => ({
      name: m.name,
      volume: m.volume,
      volumeUnit: m.volumeUnit,
      quantity: m.quantity,
      unitPrice: m.unitPrice,
      amount: m.amount,
      subcontractor: m.subcontractor,
      order: m.order,
    })),
    subcontractorRecords: current.subcontractorRecords.map((s) => ({
      name: s.name,
      workerCount: s.workerCount,
      workContent: s.workContent,
      order: s.order,
    })),
  };

  const res = await apiFetch(`/api/work-report/${createdReportId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (res.status === 200 && res.body?.id === createdReportId) {
    const weatherOk = res.body.weather === '曇り';
    const notesOk = res.body.contactNotes === '更新されたテスト連絡事項';
    const workersOk = res.body.workerRecords?.length === 1;
    const materialsOk = res.body.materialRecords?.length === 1;

    if (weatherOk && notesOk && workersOk && materialsOk) {
      log('PASS', 'Update report', `weather="${res.body.weather}", contactNotes="${res.body.contactNotes}"`);
    } else {
      log('FAIL', 'Update report', `weather=${weatherOk}, notes=${notesOk}, workers=${workersOk}, materials=${materialsOk}`);
    }
  } else {
    log('FAIL', 'Update report', `status=${res.status}, body=${JSON.stringify(res.body).substring(0, 300)}`);
  }
}

// ============================================================
// Cleanup: delete all test reports
// ============================================================

async function cleanup() {
  console.log('\n--- Cleanup: Deleting test reports ---');
  const idsToDelete = [createdReportId, ...bulkReportIds].filter(Boolean);
  let deleteOk = 0;
  let deleteFail = 0;

  for (const id of idsToDelete) {
    const res = await apiFetch(`/api/work-report/${id}`, { method: 'DELETE' });
    if (res.status === 200 && res.body?.success) {
      deleteOk++;
    } else {
      deleteFail++;
      console.log(`  Warning: Failed to delete report ${id}: status=${res.status}`);
    }
  }
  console.log(`  Deleted ${deleteOk}/${idsToDelete.length} reports${deleteFail > 0 ? ` (${deleteFail} failed)` : ''}`);
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('==============================================');
  console.log('  anjima-nippo-app E2E Test Suite');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log('==============================================');

  // 1. Login
  const loggedIn = await testLogin();
  if (!loggedIn) {
    console.log('\nAborting: Cannot proceed without authentication.');
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(1);
  }

  // 2. Get Projects
  await testGetProjects();

  // 3. Create Single Report
  await testCreateSingleReport();

  // 4. Get Created Report
  await testGetCreatedReport();

  // 5. Bulk Create
  await testBulkCreate();

  // 6. Bulk Exists Check
  await testBulkExists();

  // 7. Get One Bulk Report
  await testGetBulkReport();

  // 8. Get Materials Master
  await testGetMaterials();

  // 9. Duplicate Date Rejection
  await testDuplicateDateRejection();

  // 10. Update Report
  await testUpdateReport();

  // Cleanup
  await cleanup();

  // Summary
  console.log('\n==============================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('==============================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
