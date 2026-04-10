import { useState, useEffect, useMemo } from 'react';
import './App.css';
import PointsTable from './components/PointsTable';
import MatchSchedule from './components/MatchSchedule';
import DataLoader from './utils/DataLoader';

function App() {
  const [pointsTable, setPointsTable] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractMatches = (scheduleData) => {
    const allMatches = [];
    if (scheduleData.matchDetails) {
      scheduleData.matchDetails.forEach(item => {
        if (item.matchDetailsMap && item.matchDetailsMap.match) {
          item.matchDetailsMap.match.forEach(match => {
            allMatches.push(match);
          });
        }
      });
    }
    return allMatches;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { pointsTable: ptData, schedule: schData } = await DataLoader.loadAll();
      setPointsTable(ptData.pointsTable[0].pointsTableInfo);
      setSchedule(extractMatches(schData));
    } catch (err) {
      console.error('Failed to fetch data:', err.message);
      setError(err.message);
    }
    setLoading(false);
  };

  const handlePrediction = (matchId, winnerId) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: winnerId
    }));
  };

  const updatedTable = useMemo(() => {
    const table = pointsTable.map(team => ({
      ...team,
      matchesPlayed: team.matchesPlayed || 0,
      matchesWon: team.matchesWon || 0,
      matchesLost: team.matchesLost || 0,
      points: team.points || 0,
      nrr: team.nrr || '0.000',
    }));

    schedule.forEach(match => {
      if (!match.matchInfo) return;
      const prediction = predictions[match.matchInfo.matchId];
      if (prediction && match.matchInfo.state !== 'Complete') {
        const team1Id = match.matchInfo.team1?.teamId;
        const team2Id = match.matchInfo.team2?.teamId;
        if (!team1Id || !team2Id) return;

        const team1Index = table.findIndex(team => team.teamId === team1Id);
        const team2Index = table.findIndex(team => team.teamId === team2Id);

        if (team1Index !== -1 && team2Index !== -1) {
          if (prediction === team1Id) {
            table[team1Index] = {
              ...table[team1Index],
              matchesPlayed: table[team1Index].matchesPlayed + 1,
              matchesWon: table[team1Index].matchesWon + 1,
              points: table[team1Index].points + 2
            };
            table[team2Index] = {
              ...table[team2Index],
              matchesPlayed: table[team2Index].matchesPlayed + 1,
              matchesLost: table[team2Index].matchesLost + 1
            };
          } else if (prediction === team2Id) {
            table[team2Index] = {
              ...table[team2Index],
              matchesPlayed: table[team2Index].matchesPlayed + 1,
              matchesWon: table[team2Index].matchesWon + 1,
              points: table[team2Index].points + 2
            };
            table[team1Index] = {
              ...table[team1Index],
              matchesPlayed: table[team1Index].matchesPlayed + 1,
              matchesLost: table[team1Index].matchesLost + 1
            };
          }
        }
      }
    });

    return table.sort((a, b) => (b.points - a.points) || (parseFloat(b.nrr) - parseFloat(a.nrr)));
  }, [pointsTable, schedule, predictions]);

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">
              <span className="title-main">RCB Calculator</span>
              <span className="title-sub">IPL 2026 Playoffs Predictor</span>
            </h1>
          </div>
          <div className="header-right">
            <a
              href="https://github.com/vijay-yadav-3/rcb-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
              aria-label="View source on GitHub"
            >
              <svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </a>
            <button
              className="reset-btn"
              onClick={() => {
                setPredictions({});
                loadData();
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <p>Failed to load data: {error}</p>
            <button className="reset-btn" onClick={loadData}>Retry</button>
          </div>
        )}

        {!loading && !error && (
        <div className="content-grid">
          <section className="points-section">
            <h2>Current Points Table</h2>
            <PointsTable teams={updatedTable} />
          </section>

          <section className="schedule-section">
            <h2>Upcoming Matches</h2>
            <MatchSchedule
              matches={schedule}
              predictions={predictions}
              onPrediction={handlePrediction}
            />
          </section>
        </div>
        )}
      </main>
    </div>
  );
}

export default App;
