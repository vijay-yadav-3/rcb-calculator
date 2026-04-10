/**
 * Scrapes Cricbuzz for IPL 2026 data.
 * Refactored for readability and efficiency.
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  SERIES_ID: 9241,
  SERIES_SLUG: 'indian-premier-league-2026',
  BASE_URL: 'https://www.cricbuzz.com',
  OUT_DIR: path.join(__dirname, '..', 'public', 'data'),
  HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }
};

/**
 * Modernized Fetch using Promises and redirect handling
 */
async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: CONFIG.HEADERS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchPage(new URL(res.headers.location, url).href));
      }
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

/**
 * Simplifies the extraction of specific JSON keys from the HTML/RSC payload.
 */
function extractData(html, key) {
  // Regex looks for the key followed by either { or [
  // Accounts for escaped quotes (\") often found in RSC payloads
  const regex = new RegExp(`\\\\?"${key}\\\\?":\\s*(\\{|\\[)`, 'g');
  const match = regex.exec(html);
  if (!match) return null;

  let startIdx = match.index + match[0].length - 1;
  let depth = 0;
  let inString = false;

  for (let i = startIdx; i < html.length; i++) {
    const char = html[i];
    
    // Handle strings to avoid counting brackets inside text
    if (char === '"' && html[i - 1] !== '\\') inString = !inString;
    if (inString) continue;

    if (char === '{' || char === '[') depth++;
    else if (char === '}' || char === ']') {
      depth--;
      if (depth === 0) {
        let jsonStr = html.substring(startIdx, i + 1);
        // Clean up escaped characters if present
        jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\\//g, '/');
        try {
          return JSON.parse(jsonStr);
        } catch (e) {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * Transformation logic for Points Table
 */
function transformPoints(html) {
  const data = extractData(html, 'pointsData')?.pointsTable || extractData(html, 'pointsTable');
  if (!data) throw new Error('Points data not found');

  return {
    pointsTable: data.map(group => ({
      groupName: group.groupName,
      pointsTableInfo: group.pointsTableInfo.map(t => ({
        teamId: t.teamId,
        teamName: t.teamName,
        teamFullName: t.teamFullName,
        matchesPlayed: t.matchesPlayed,
        matchesWon: t.matchesWon,
        matchesLost: t.matchesLost || 0,
        points: t.points,
        nrr: t.nrr,
      }))
    }))
  };
}

/**
 * Transformation logic for Schedule
 */
function transformSchedule(html) {
  const data = extractData(html, 'matchesData')?.matchDetails || extractData(html, 'matchDetails');
  if (!data) throw new Error('Schedule data not found');

  return {
    matchDetails: data
      .filter(item => item.matchDetailsMap)
      .map(item => ({
        matchDetailsMap: {
          key: item.matchDetailsMap.key,
          match: item.matchDetailsMap.match.map(m => ({
            matchInfo: {
              matchId: m.matchInfo.matchId,
              matchDesc: m.matchInfo.matchDesc,
              startDate: m.matchInfo.startDate,
              state: m.matchInfo.state,
              status: m.matchInfo.status,
              team1: { teamId: m.matchInfo.team1.teamId, teamName: m.matchInfo.team1.teamName, teamSName: m.matchInfo.team1.teamSName },
              team2: { teamId: m.matchInfo.team2.teamId, teamName: m.matchInfo.team2.teamName, teamSName: m.matchInfo.team2.teamSName },
            },
            matchScore: m.matchScore || null
          }))
        }
      }))
  };
}

/**
 * Main Orchestrator
 */
async function main() {
  try {
    await fs.mkdir(CONFIG.OUT_DIR, { recursive: true });

    // 1. Points Table
    console.log('Fetching Points Table...');
    const ptHtml = await fetchPage(`${CONFIG.BASE_URL}/cricket-series/${CONFIG.SERIES_ID}/${CONFIG.SERIES_SLUG}/points-table`);
    const pointsJson = transformPoints(ptHtml);
    await fs.writeFile(path.join(CONFIG.OUT_DIR, 'pointsTable.json'), JSON.stringify(pointsJson, null, 2));
    console.log(`✓ Saved Points Table (${pointsJson.pointsTable[0]?.pointsTableInfo.length} teams)`);

    // 2. Schedule
    console.log('Fetching Schedule...');
    const schHtml = await fetchPage(`${CONFIG.BASE_URL}/cricket-series/${CONFIG.SERIES_ID}/${CONFIG.SERIES_SLUG}/matches`);
    const scheduleJson = transformSchedule(schHtml);
    await fs.writeFile(path.join(CONFIG.OUT_DIR, 'schedule.json'), JSON.stringify(scheduleJson, null, 2));
    console.log('✓ Saved Schedule');

  } catch (error) {
    console.error('Execution Failed:', error.message);
    process.exit(1);
  }
}

main();