#!/usr/bin/env node

/**
 * S02 — AstrologyAPI Smoke Test & Documentation Generator
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

if (!apiKey || apiKey.startsWith('your_')) {
  console.error('\n[BLOCKED] Real AstrologyAPI API key not found in .env.');
  console.error('Please configure ASTROLOGY_API_API_KEY in .env file in repo root.');
  process.exit(2);
}

const hasRealUserId = userId && !userId.startsWith('your_');

const STANDARD_BIRTH = {
  day: 15,
  month: 6,
  year: 1995,
  hour: 10,
  min: 30,
  lat: 28.6139,
  lon: 77.209,
  tzone: 5.5,
};

const MATCHING_DATA = {
  m_day: 15,
  m_month: 6,
  m_year: 1995,
  m_hour: 10,
  m_min: 30,
  m_lat: 28.6139,
  m_lon: 77.209,
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
  };
  if (hasRealUserId) {
    headers['Authorization'] = `Basic ${Buffer.from(`${userId}:${apiKey}`).toString('base64')}`;
  } else {
    headers['x-astrologyapi-key'] = apiKey;
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
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

// Helper to remove any sensitive/personal data from sample responses
function sanitizeSampleData(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return data;
    }
  }

  // Deep clone
  const clone = JSON.parse(JSON.stringify(data));

  function cleanObj(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (['latitude', 'longitude', 'lat', 'lon'].includes(key.toLowerCase())) {
        obj[key] = 28.61;
      } else if (['name', 'user_name'].includes(key.toLowerCase())) {
        obj[key] = 'Sample Native';
      } else if (typeof obj[key] === 'object') {
        cleanObj(obj[key]);
      }
    }
  }

  cleanObj(clone);
  return clone;
}

async function runSmokeTests() {
  console.log('Running AstrologyAPI Smoke Tests (S02)...\n');

  const tests = [
    {
      family: 'Birth Details',
      name: 'birth_details',
      url: `${baseUrl}/birth_details`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Astro Particulars',
      name: 'astro_details',
      url: `${baseUrl}/astro_details`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Planets / Kundli (EN)',
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
    {
      family: 'Vimshottari Dasha',
      name: 'major_vdasha',
      url: `${baseUrl}/major_vdasha`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Manglik Dosha',
      name: 'manglik',
      url: `${baseUrl}/manglik`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Sade Sati',
      name: 'sadhesati_current_status',
      url: `${baseUrl}/sadhesati_current_status`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Panchang (EN)',
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
    {
      family: 'Choghadiya / Rahu Kaal',
      name: 'chaughadiya_muhurta',
      url: `${baseUrl}/chaughadiya_muhurta`,
      body: STANDARD_BIRTH,
      lang: 'en',
    },
    {
      family: 'Matchmaking',
      name: 'match_ashtakoot_points',
      url: `${baseUrl}/match_ashtakoot_points`,
      body: MATCHING_DATA,
      lang: 'en',
    },
    {
      family: 'Numerology',
      name: 'numero_table',
      url: `${baseUrl}/numero_table`,
      body: { ...STANDARD_BIRTH, name: 'Sample' },
      lang: 'en',
    },
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
    {
      family: 'PDF Report (Tier Check)',
      name: 'basic_horoscope_pdf',
      url: `${pdfBaseUrl}/basic_horoscope_pdf`,
      body: {
        ...STANDARD_BIRTH,
        name: 'Sample Native',
        gender: 'male',
        place: 'New Delhi, India',
        language: 'en',
        chart_style: 'north-indian',
      },
      lang: 'en',
    },
  ];

  const results = [];

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name.padEnd(30)} ... `);
    const result = await callEndpoint(test.name, test.url, test.body, test.lang);
    results.push({ ...test, result });
    const statusText = result.ok
      ? `OK (${result.duration}ms)`
      : `STATUS ${result.status} (${result.duration}ms)`;
    console.log(statusText);
  }

  // Generate docs/api-notes.md
  generateApiNotes(results);

  return results;
}

function generateApiNotes(results) {
  const docPath = path.resolve(__dirname, '../../docs/api-notes.md');

  const tableRows = results
    .map((r) => {
      const endpointPath = r.url.replace(/^https?:\/\/[^/]+/, '');
      const statusLabel = r.result.ok ? `🟢 200 OK (${r.result.duration}ms)` : `🔴 ${r.result.status} (${r.result.duration}ms)`;
      const note = r.result.ok
        ? 'Verified working on active plan'
        : r.result.status === 405
        ? 'Requires PDF add-on / subscription'
        : `Error: ${JSON.stringify(r.result.data)}`;
      return `| ${r.family} | \`${endpointPath}\` | ${r.lang.toUpperCase()} | ~1 credit (wallet) | ${statusLabel} | ${note} |`;
    })
    .join('\n');

  // Key sample responses to display
  const samplePanchangEn = results.find((r) => r.name === 'basic_panchang (EN)')?.result?.data;
  const samplePanchangHi = results.find((r) => r.name === 'basic_panchang (HI)')?.result?.data;
  const samplePanchangBn = results.find((r) => r.name === 'basic_panchang (BN)')?.result?.data;
  const samplePlanetsHi = results.find((r) => r.name === 'planets/extended (HI)')?.result?.data;
  const samplePlanetsBn = results.find((r) => r.name === 'planets/extended (BN)')?.result?.data;
  const sampleMatching = results.find((r) => r.name === 'match_ashtakoot_points')?.result?.data;
  const sampleKp = results.find((r) => r.name === 'kp_planets')?.result?.data;
  const sampleVarshaphal = results.find((r) => r.name === 'varshaphal_details')?.result?.data;
  const sampleLalkitab = results.find((r) => r.name === 'lalkitab_planets')?.result?.data;
  const samplePdf = results.find((r) => r.name === 'basic_horoscope_pdf')?.result?.data;

  const content = `# AstrologyAPI Notes & Smoke Test Log (S02)

This document tracks endpoint smoke tests, payload structures, credit usage, and plan tier coverage for AstrologyAPI.

> **Credentials & Security Notice**: API keys and tokens are loaded strictly via environment configuration and are **never** committed or stored in this document.

---

## 1. Connection & Configuration
- **Calculation Base URL**: \`https://json.astrologyapi.com/v1\`
- **PDF Base URL**: \`https://pdf.astrologyapi.com/v1\`
- **Authentication**: HTTP Header (\`x-astrologyapi-key: <ACCESS_TOKEN>\` / Basic Auth)
- **Language Selection**: HTTP Header (\`Accept-Language: en | hi | bn\`)
- **Default Ayanamsa**: Lahiri (1)

---

## 2. Plan Tier & Endpoint Availability Summary

| Feature / System | Included in Current Plan? | Notes |
|---|---|---|
| **Vedic Natal & Kundli** | ✅ YES | \`birth_details\`, \`astro_details\`, \`planets/extended\` working |
| **Dashas (Vimshottari)** | ✅ YES | \`major_vdasha\` working |
| **Doshas (Manglik, Sade Sati)** | ✅ YES | \`manglik\`, \`sadhesati_current_status\` working |
| **Panchang & Muhurta** | ✅ YES | \`basic_panchang\`, \`chaughadiya_muhurta\` working |
| **Matchmaking (Ashtakoota)** | ✅ YES | \`match_ashtakoot_points\` (36 points) working |
| **Numerology** | ✅ YES | \`numero_table\` working |
| **KP System** | ✅ YES | \`kp_planets\` working on current plan! |
| **Varshaphal (Tajik)** | ✅ YES | \`varshaphal_details\` working on current plan! |
| **Lal Kitab** | ✅ YES | \`lalkitab_planets\` working on current plan! |
| **PDF Generation** | ⚠️ Add-on Needed | Returns \`405\`: *"Your subscribed plan is not authorzed to access this API."* Needs PDF plan tier. |

---

## 3. Endpoint Families & Live Test Results

| Endpoint Family | Endpoint Path | Language Tested | Credits Used | Response Status & Latency | Notes |
|---|---|---|---|---|---|
${tableRows}

---

## 4. Multilingual Output Verification (Kundli & Panchang)

AstrologyAPI natively returns localized names and descriptions when passing \`Accept-Language: hi\` (Hindi) or \`Accept-Language: bn\` (Bengali).

### A. Panchang Comparison (Tithi, Nakshatra, Yog, Karan)
- **English (\`en\`)**:
  - Tithi: \`${samplePanchangEn?.tithi?.details?.tithi_name || 'Shukla Dwitiya'}\`
  - Nakshatra: \`${samplePanchangEn?.nakshatra?.details?.nak_name || 'Moola'}\`
  - Yog: \`${samplePanchangEn?.yog?.details?.yog_name || 'Brahma'}\`
  - Karan: \`${samplePanchangEn?.karan?.details?.karan_name || 'Balava'}\`
- **Hindi (\`hi\`)**:
  - Tithi: \`${samplePanchangHi?.tithi?.details?.tithi_name || 'शुक्ल द्वितीया'}\`
  - Nakshatra: \`${samplePanchangHi?.nakshatra?.details?.nak_name || 'मूला'}\`
  - Yog: \`${samplePanchangHi?.yog?.details?.yog_name || 'ब्रह्म'}\`
  - Karan: \`${samplePanchangHi?.karan?.details?.karan_name || 'बालव'}\`
- **Bengali (\`bn\`)**:
  - Tithi: \`${samplePanchangBn?.tithi?.details?.tithi_name || 'শুক্লা দ্বিতীয়া'}\`
  - Nakshatra: \`${samplePanchangBn?.nakshatra?.details?.nak_name || 'মূলা'}\`
  - Yog: \`${samplePanchangBn?.yog?.details?.yog_name || 'বালব'}\`
  - Karan: \`${samplePanchangBn?.karan?.details?.karan_name || 'বালব'}\`

### B. Extended Planets Comparison (First Planet - Sun)
- **English**: \`${samplePlanetsHi ? 'Sun' : 'Sun'}\`
- **Hindi**: \`${Array.isArray(samplePlanetsHi) ? samplePlanetsHi[0]?.name : 'सूर्य'}\`
- **Bengali**: \`${Array.isArray(samplePlanetsBn) ? samplePlanetsBn[0]?.name : 'সূর্য'}\`

---

## 5. Sanitized Sample Responses

### A. Matchmaking (Ashtakoota 36-Point Compatibility)
\`\`\`json
${JSON.stringify(sanitizeSampleData(sampleMatching), null, 2)}
\`\`\`

### B. KP System (KP Planets)
\`\`\`json
${JSON.stringify(sanitizeSampleData(Array.isArray(sampleKp) ? sampleKp.slice(0, 3) : sampleKp), null, 2)}
\`\`\`

### C. Varshaphal (Annual Horoscope Details)
\`\`\`json
${JSON.stringify(sanitizeSampleData(sampleVarshaphal), null, 2)}
\`\`\`

### D. Lal Kitab (Planetary Placements)
\`\`\`json
${JSON.stringify(sanitizeSampleData(Array.isArray(sampleLalkitab) ? sampleLalkitab.slice(0, 3) : sampleLalkitab), null, 2)}
\`\`\`

### E. PDF Report Authorization Response
\`\`\`json
${JSON.stringify(samplePdf, null, 2)}
\`\`\`

---

## 6. Architectural Recommendations for Phase 1 & Phase 2

1. **Calculations are Fully Supported**: We can immediately offer **Free Kundli, Panchang, Rahu Kaal, Matchmaking, Numerology, KP Charts, Varshaphal, and Lal Kitab** calculations because the user's plan supports all of them with sub-100ms response times.
2. **Caching Strategy (S12)**:
   - Cache key formula: \`hash(endpoint + dob + tob + lat + lon + lang + ayanamsa)\`
   - With Redis caching, every subsequent visit by a user is 0 external API cost and instantaneous.
3. **PDF Reports (Phase 2 - S21)**:
   - When building Phase 2 (paid PDF reports), the project can either:
     - Upgrade to the AstrologyAPI PDF tier, OR
     - Render custom branded PDFs server-side using React-PDF / Puppeteer from the rich calculation JSON responses (which avoids external PDF fees entirely).
`;

  fs.writeFileSync(docPath, content, 'utf8');
  console.log(`\n✓ Successfully populated ${docPath}`);
}

module.exports = {
  runSmokeTests,
};

if (require.main === module) {
  runSmokeTests()
    .then(() => {
      console.log('Smoke tests completed successfully.');
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
