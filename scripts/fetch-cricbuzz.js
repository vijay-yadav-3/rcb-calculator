/**
 * Scrapes Cricbuzz website for IPL 2026 data and produces JSON files
 * matching the format of public/data/pointsTable.json and schedule.json.
 *
 * The data is extracted from the Next.js RSC payload embedded in the HTML,
 * which contains the same structured JSON the API would return.
 *
 * No API key needed.
 *
 * Usage:
 *   Local:   node scripts/fetch-cricbuzz.js
 *   Actions: node scripts/fetch-cricbuzz.js --actions
 *
 * Output:
 *   Local:   public/data/pointsTable.json, public/data/schedule.json
 *   Actions: pointsTable.json, schedule.json (in working directory)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const isActions = process.argv.includes('--actions');
const SERIES_ID = 9241;
const SERIES_SLUG = 'indian-premier-league-2026';
const BASE = 'https://www.cricbuzz.com';
const outDir = isActions ? process.cwd() : path.join(__dirname, '..', 'public', 'data');
fs.mkdirSync(outDir, { recursive: true });

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    https.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: HEADERS,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://${parsed.hostname}${res.headers.location}`;
        return fetchPage(loc).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}


// ─── Extract JSON data from Next.js RSC payload in HTML ───

/**
 * The Cricbuzz pages embed structured data in the Next.js RSC flight payload.
 * For the schedule page, it contains a "matchesData" object with the full
 * matchDetails array. For the points table, it contains "pointsData".
 * We extract these by searching for the known JSON keys in the HTML.
 */

function extractJsonObject(html, startKey) {
  let idx = html.indexOf(`${startKey}\\":{`);
  let escaped = true;
  if (idx === -1) {
    idx = html.indexOf(`${startKey}\\":[`);
  }
  if (idx === -1) {
    idx = html.indexOf(`"${startKey}":{`);
    escaped = false;
  }
  if (idx === -1) {
    idx = html.indexOf(`"${startKey}":[`);
    escaped = false;
  }
  if (idx === -1) return null;

  const keyEnd = html.indexOf(escaped ? '\\":' : '":', idx);
  if (keyEnd === -1) return null;
  let i = keyEnd + (escaped ? 3 : 2);

  while (i < html.length && /\s/.test(html[i])) i++;

  if (escaped) {
    const open = html[i];
    if (open !== '{' && open !== '[') return null;

    let depth = 0;
    let start = i;
    for (; i < html.length; i++) {
      const ch = html[i];
      if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') {
        depth--;
        if (depth === 0) {
          let jsonStr = html.substring(start, i + 1);
          jsonStr = jsonStr.replace(/\\"/g, '"');
          jsonStr = jsonStr.replace(/\\\//g, '/');
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            console.warn(`  Failed to parse escaped JSON for "${startKey}": ${e.message}`);
            return null;
          }
        }
      }
    }
  } else {
    const open = html[i];
    if (open !== '{' && open !== '[') return null;
    let depth = 0;
    let start = i;
    let inStr = false;
    let esc = false;

    for (; i < html.length; i++) {
      const ch = html[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{' || ch === '[') depth++;
      if (ch === '}' || ch === ']') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(html.substring(start, i + 1));
          } catch (e) {
            console.warn(`  Failed to parse JSON for "${startKey}": ${e.message}`);
            return null;
          }
        }
      }
    }
  }
  return null;
}


// ─── Points Table: extract from HTML ───
function parsePointsTable(html) {
  let pointsTable;
  const pointsData = extractJsonObject(html, 'pointsData');
  if (pointsData && pointsData.pointsTable) {
    pointsTable = pointsData.pointsTable;
  } else {
    const ptDirect = extractJsonObject(html, 'pointsTable');
    if (ptDirect && Array.isArray(ptDirect)) {
      pointsTable = ptDirect;
    }
  }
  if (!pointsTable) {
    throw new Error('Could not extract points data from page');
  }
  console.log('  Extracted points data from RSC payload');
  return {
    pointsTable: pointsTable.map(group => ({
      groupName: group.groupName,
      pointsTableInfo: group.pointsTableInfo.map(team => {
        const entry = {
          teamId: team.teamId,
          teamName: team.teamName,
          teamFullName: team.teamFullName,
          matchesPlayed: team.matchesPlayed,
          matchesWon: team.matchesWon,
          points: team.points,
          nrr: team.nrr,
        };
        if (team.matchesLost) entry.matchesLost = team.matchesLost;
        return entry;
      })
    }))
  };
}

// ─── Schedule: extract from HTML ───
function parseSchedule(html) {
  let matchDetails;
  const matchesData = extractJsonObject(html, 'matchesData');
  if (matchesData && matchesData.matchDetails) {
    matchDetails = matchesData.matchDetails;
  } else {
    const mdDirect = extractJsonObject(html, 'matchDetails');
    if (mdDirect && Array.isArray(mdDirect)) {
      matchDetails = mdDirect;
    }
  }
  if (!matchDetails) {
    throw new Error('Could not extract schedule data from page');
  }
  console.log('  Extracted schedule data from RSC payload');
  return {
    matchDetails: matchDetails
      .filter(item => item.matchDetailsMap)
      .map(item => ({
        matchDetailsMap: {
          key: item.matchDetailsMap.key,
          match: item.matchDetailsMap.match.map(m => {
            const info = m.matchInfo;
            const stripped = {
              matchInfo: {
                matchId: info.matchId,
                matchDesc: info.matchDesc,
                startDate: info.startDate,
                state: info.state,
                status: info.status,
                team1: { teamId: info.team1.teamId, teamName: info.team1.teamName, teamSName: info.team1.teamSName },
                team2: { teamId: info.team2.teamId, teamName: info.team2.teamName, teamSName: info.team2.teamSName },
              },
            };
            if (m.matchScore) stripped.matchScore = m.matchScore;
            return stripped;
          }),
        },
      })),
  };
}

// ─── Main ───
(async () => {
  try {
    // 1. Points table
    console.log('Fetching points table...');
    const ptHtml = await fetchPage(`${BASE}/cricket-series/${SERIES_ID}/${SERIES_SLUG}/points-table`);
    const pointsTable = parsePointsTable(ptHtml);
    const teamCount = pointsTable.pointsTable[0]?.pointsTableInfo?.length || 0;
    console.log(`  Found ${teamCount} teams`);

    fs.writeFileSync(path.join(outDir, 'pointsTable.json'), JSON.stringify(pointsTable, null, 2));
    console.log(`  Saved ${path.join(outDir, 'pointsTable.json')}\n`);

    // 2. Schedule
    console.log('Fetching schedule...');
    const schHtml = await fetchPage(`${BASE}/cricket-series/${SERIES_ID}/${SERIES_SLUG}/matches`);
    const schedule = parseSchedule(schHtml);
    const matchCount = schedule.matchDetails.reduce((sum, d) => sum + (d.matchDetailsMap?.match?.length || 0), 0);
    console.log(`  Found ${matchCount} matches across ${schedule.matchDetails.length} date groups`);

    fs.writeFileSync(path.join(outDir, 'schedule.json'), JSON.stringify(schedule, null, 2));
    console.log(`  Saved ${path.join(outDir, 'schedule.json')}\n`);

    console.log('Done!');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
