#!/usr/bin/env node

/**
 * S02 — AstrologyAPI Smoke Test Runner
 *
 * Calls one endpoint per endpoint family, tests localized responses (en, hi, bn),
 * records latency and plan availability, and populates docs/api-notes.md.
 *
 * Security: Reads credentials strictly from config. Never prints, logs, or writes keys.
 */

const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

// Load repo root .env
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const { loadConfig } = require('../src/config/loadConfig');

let config;
try {
  config = loadConfig(process.env);
} catch (err) {
  console.error('[CONFIG ERROR] Unable to load valid configuration.');
  console.error(err.message);
  process.exit(1);
}

const userId = config.astrologyApi.userId;
const apiKey = config.astrologyApi.apiKey;
const baseUrl = (config.astrologyApi.baseUrl || 'https://json.astrologyapi.com/v1').replace(/\/+$/, '');
const pdfBaseUrl = 'https://pdf.astrologyapi.com/v1';

if (!userId || !apiKey || userId.startsWith('your_') || apiKey.startsWith('your_')) {
  console.error('\n[BLOCKED] Real AstrologyAPI credentials not found in .env.');
  console.error('Please configure ASTROLOGY_API_USER_ID and ASTROLOGY_API_API_KEY in .env file in repo root.');
  process.exit(2);
}

const authHeader = `Basic ${Buffer.from(`${userId}:${apiKey}`).toString('base64')}`;

const STANDARD_BIRTH = {
  day: 15,
  month: 6,
  year: 1995,
  hour: 10,
  min: 30,
  lat: 28.6139,
  lon: 77.2090,
  tzone: 5.5,
};

const MATCHING_DATA = {
  m_day: 15,
  m_month: 6,
  m_year: 1995,
  m_hour: 10,
  m_min: 30,
  m_lat: 28.6139,
  m_lon: 77.2090,
  m_tzone: 5.5,
  f_day: 20,
  f_month: 8,
  f_year: 1996,
  f_hour: 14,
  f_min: 15,
  f_lat: 19.076,
  f_lon: 72.8777,
  f_tzone: 5.5,
};

async function callEndpoint(name, url, body, lang = 'en') {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
  };
  if (lang) {
    headers['Accept-Language'] = lang;
  }

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const duration = Date.now() - start;
    const isJson = res.headers.get('content-type')?.includes('application/json');
    let data;
    if (isJson) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      name,
      url,
      lang,
      status: res.status,
      ok: res.ok,
      duration,
      headers: Object.fromEntries(res.headers.entries()),
      data,
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      name,
      url,
      lang,
      status: 0,
      ok: false,
      duration,
      error: error.message,
    };
  }
}

async function runSmokeTests() {
  console.log('Running AstrologyAPI Smoke Tests (S02)...\n');

  const tests = [
    // 1. Birth Details
    {
      family: 'Birth Details',
      name: 'birth_details (EN)',
      url: `${baseUrl}/birth_details`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Birth Details (Astro)',
      name: 'astro_details (EN)',
      url: `${baseUrl}/astro_details`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    // 2. Planets
    {
      family: 'Planets / Kundli',
      name: 'planets/extended (EN)',
      url: `${baseUrl}/planets/extended`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Planets / Kundli (HI)',
      name: 'planets/extended (HI)',
      url: `${baseUrl}/planets/extended`,
      body: STANDARD_BIRTH,
      lang: 'hi',
    },
    {
      family: 'Planets / Kundli (BN)',
      name: 'planets/extended (BN)',
      url: `${baseUrl}/planets/extended`,
      body: STANDARD_BIRTH,
      lang: 'bn',
    },
    // 3. Vimshottari Dasha
    {
      family: 'Vimshottari Dasha',
      name: 'major_vdasha (EN)',
      url: `${baseUrl}/major_vdasha`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    // 4. Manglik Dosha
    {
      family: 'Manglik',
      name: 'manglik (EN)',
      url: `${baseUrl}/manglik`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    // 5. Sade Sati
    {
      family: 'Sade Sati',
      name: 'sadhesati_current_status (EN)',
      url: `${baseUrl}/sadhesati_current_status`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    // 6. Panchang
    {
      family: 'Panchang',
      name: 'basic_panchang (EN)',
      url: `${baseUrl}/basic_panchang`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Panchang (HI)',
      name: 'basic_panchang (HI)',
      url: `${baseUrl}/basic_panchang`,
      body: STANDARD_BIRTH,
      lang: 'hi',
    },
    {
      family: 'Panchang (BN)',
      name: 'basic_panchang (BN)',
      url: `${baseUrl}/basic_panchang`,
      body: STANDARD_BIRTH,
      lang: 'bn',
    },
    // 7. Choghadiya / Rahu Kaal
    {
      family: 'Choghadiya / Rahu Kaal',
      name: 'chaughadiya_muhurta (EN)',
      url: `${baseUrl}/chaughadiya_muhurta`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    // 8. Matchmaking
    {
      family: 'Matching',
      name: 'match_ashtakoot_points (EN)',
      url: `${baseUrl}/match_ashtakoot_points`,
      body: MATCHING_DATA,
      lang: 'en',
    },
    // 9. Numerology
    {
      family: 'Numerology',
      name: 'numero_table (EN)',
      url: `${baseUrl}/numero_table`,
      body: { ...STANDARD_BIRTH, name: 'Sample' },
      lang: 'en',
    },
    // 10. PDF Report
    {
      family: 'PDF Report',
      name: 'basic_horoscope_pdf',
      url: `${pdfBaseUrl}/basic_horoscope_pdf`,
      body: { ...STANDARD_BIRTH, name: 'Sample User', gender: 'male' },
      lang: 'en',
    },
    // Plan Tier Verification: KP, Varshaphal, Lal Kitab
    {
      family: 'KP System (Tier Check)',
      name: 'kp_planets',
      url: `${baseUrl}/kp_planets`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Varshaphal (Tier Check)',
      name: 'varshaphal_details',
      url: `${baseUrl}/varshaphal_details`,
      body: { ...STANDARD_BIRTH, varshaphal_year: 2026 },
      lang: 'en',
    },
    {
      family: 'Lal Kitab (Tier Check)',
      name: 'lalkitab_planets',
      url: `${baseUrl}/lalkitab_planets`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
  ];

  const results = [];

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name.padEnd(30)} ... `);
    const result = await callEndpoint(test.name, test.url, test.body, test.lang);
    results.push({ ...test, result });
    const statusText = result.ok ? `OK (${result.duration}ms)` : `FAILED [${result.status}] (${result.duration}ms)`;
    console.log(statusText);
  }

  return results;
}

module.exports = {
  runSmokeTests,
};

if (require.main === module) {
  runSmokeTests()
    .then((results) => {
      console.log('\nAll smoke tests finished.');
    })
    .catch((err) => {
      console.error('Fatal error during smoke test execution:', err);
      process.exit(1);
    });
}
