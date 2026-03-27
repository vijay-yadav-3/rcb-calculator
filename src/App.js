import { useState, useEffect } from 'react';
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
      const [ptData, schData] = await Promise.all([
        DataLoader.loadPointsTable(),
        DataLoader.loadSchedule(),
      ]);
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

  const calculateUpdatedTable = () => {
    const updatedTable = pointsTable.map(team => ({
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
      if (prediction && (match.matchInfo.state === 'Upcoming' || match.matchInfo.state === 'Preview')) {
        const team1Id = match.matchInfo.team1?.teamId;
        const team2Id = match.matchInfo.team2?.teamId;
        if (!team1Id || !team2Id) return;

        const team1Index = updatedTable.findIndex(team => team.teamId === team1Id);
        const team2Index = updatedTable.findIndex(team => team.teamId === team2Id);

        if (team1Index !== -1 && team2Index !== -1) {
          if (prediction === team1Id) {
            updatedTable[team1Index] = {
              ...updatedTable[team1Index],
              matchesPlayed: updatedTable[team1Index].matchesPlayed + 1,
              matchesWon: updatedTable[team1Index].matchesWon + 1,
              points: updatedTable[team1Index].points + 2
            };
            updatedTable[team2Index] = {
              ...updatedTable[team2Index],
              matchesPlayed: updatedTable[team2Index].matchesPlayed + 1,
              matchesLost: updatedTable[team2Index].matchesLost + 1
            };
          } else if (prediction === team2Id) {
            updatedTable[team2Index] = {
              ...updatedTable[team2Index],
              matchesPlayed: updatedTable[team2Index].matchesPlayed + 1,
              matchesWon: updatedTable[team2Index].matchesWon + 1,
              points: updatedTable[team2Index].points + 2
            };
            updatedTable[team1Index] = {
              ...updatedTable[team1Index],
              matchesPlayed: updatedTable[team1Index].matchesPlayed + 1,
              matchesLost: updatedTable[team1Index].matchesLost + 1
            };
          }
        }
      }
    });

    return updatedTable.sort((a, b) => (b.points - a.points) || (parseFloat(b.nrr) - parseFloat(a.nrr)));
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-main">RCB Calculator</span>
            <span className="title-sub">IPL 2026 Playoffs Predictor</span>
          </h1>
          <div className="data-controls">
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
            <PointsTable teams={calculateUpdatedTable()} />
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
