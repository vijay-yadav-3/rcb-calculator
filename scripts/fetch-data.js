/**
 * Fetches cricket data from the Cricbuzz RapidAPI, strips unused fields,
 * and saves to public/data/.
 *
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

function fetchJson(apiPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'cricbuzz-cricket2.p.rapidapi.com',
      path: apiPath,
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'cricbuzz-cricket2.p.rapidapi.com',
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// ─── Strip helpers ───

function stripPointsTable(raw) {
  return {
    pointsTable: raw.pointsTable.map(group => ({
      groupName: group.groupName,
      pointsTableInfo: group.pointsTableInfo.map(team => ({
        teamId: team.teamId,
        teamName: team.teamName,
        teamFullName: team.teamFullName,
        matchesPlayed: team.matchesPlayed,
        matchesWon: team.matchesWon,
        ...(team.matchesLost !== undefined && { matchesLost: team.matchesLost }),
        points: team.points,
        nrr: team.nrr,
      }))
    }))
  };
}

function stripSchedule(raw) {
  return {
    matchDetails: raw.matchDetails
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
    console.log('Fetching pointsTable.json...');
    const rawPt = await fetchJson(endpoints['pointsTable.json']);
    const pt = stripPointsTable(rawPt);
    fs.writeFileSync(path.join(outDir, 'pointsTable.json'), JSON.stringify(pt, null, 2));
    console.log('  Saved & stripped pointsTable.json');

    console.log('Fetching schedule.json...');
    const rawSch = await fetchJson(endpoints['schedule.json']);
    const sch = stripSchedule(rawSch);
    fs.writeFileSync(path.join(outDir, 'schedule.json'), JSON.stringify(sch, null, 2));
    console.log('  Saved & stripped schedule.json');

    console.log('\nDone! Start with local data:\n  PowerShell: $env:REACT_APP_LOCAL_DATA="true"; npm start\n  CMD:        set REACT_APP_LOCAL_DATA=true && npm start\n  Mac/Linux:  REACT_APP_LOCAL_DATA=true npm start');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
