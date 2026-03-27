/**
 * Fetches cricket data from the Cricbuzz RapidAPI and saves to public/data/.
 * Usage: node scripts/fetch-data.js YOUR_RAPIDAPI_KEY
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const apiKey = process.argv[2];
if (!apiKey) {
  console.error('Usage: node scripts/fetch-data.js YOUR_RAPIDAPI_KEY');
  process.exit(1);
}

const outDir = path.join(__dirname, '..', 'public', 'data');
fs.mkdirSync(outDir, { recursive: true });

const endpoints = {
  'pointsTable.json': '/stats/v1/series/9241/points-table',
  'schedule.json': '/series/v1/9241',
};

function fetchAndSave(filename, apiPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'cricbuzz-cricket2.p.rapidapi.com',
      path: apiPath,
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'cricbuzz-cricket2.p.rapidapi.com',
      },
    };

    console.log(`Fetching ${filename}...`);
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const filepath = path.join(outDir, filename);
          fs.writeFileSync(filepath, JSON.stringify(parsed, null, 2));
          console.log(`  Saved to ${filepath}`);
          resolve();
        } catch (e) {
          reject(new Error(`Invalid JSON for ${filename}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  for (const [filename, apiPath] of Object.entries(endpoints)) {
    await fetchAndSave(filename, apiPath);
  }
  console.log('\nDone! Start with local data:\n  PowerShell: $env:REACT_APP_LOCAL_DATA="true"; npm start\n  CMD:        set REACT_APP_LOCAL_DATA=true && npm start\n  Mac/Linux:  REACT_APP_LOCAL_DATA=true npm start');
})();
