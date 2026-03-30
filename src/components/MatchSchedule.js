import React from 'react';

const MatchSchedule = ({ matches, predictions, onPrediction }) => {
  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isNotComplete = (state) => {
    return state !== 'Complete';
  };

  const upcomingMatches = matches.filter(match => 
    match.matchInfo && isNotComplete(match.matchInfo.state)
  );

  const matchesToShow = upcomingMatches.length > 0 ? upcomingMatches : matches;

  // Handle click - toggle selection (click again to deselect)
  const handleTeamClick = (matchId, teamId, currentPrediction) => {
    if (currentPrediction === teamId) {
      // Deselect if clicking the same team
      onPrediction(matchId, null);
    } else {
      // Select this team
      onPrediction(matchId, teamId);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '5px',
      maxHeight: '600px',
      overflowY: 'auto'
    },
    card: {
      background: 'white',
      borderRadius: '10px',
      padding: '10px 12px',
      boxShadow: '0 1px 6px rgba(0, 0, 0, 0.06)',
      border: '1px solid #eee'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    matchDesc: {
      fontWeight: '600',
      fontSize: '0.8rem',
      color: '#444'
    },
    matchDate: {
      fontSize: '0.65rem',
      color: '#888'
    },
    teamsContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    teamOption: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 6px',
      border: '2px solid #e8e8e8',
      borderRadius: '8px',
      cursor: 'pointer',
      background: '#fafafa',
      transition: 'all 0.15s ease',
      textAlign: 'center'
    },
    teamOptionSelected: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 6px',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      cursor: 'pointer',
      background: '#e8f5e9',
      transition: 'all 0.15s ease',
      textAlign: 'center'
    },
    teamShort: {
      fontWeight: '700',
      fontSize: '1rem',
      color: '#333'
    },
    teamShortSelected: {
      fontWeight: '700',
      fontSize: '1rem',
      color: '#2e7d32'
    },
    teamName: {
      fontSize: '0.6rem',
      color: '#999',
      marginTop: '2px'
    },
    vsText: {
      fontWeight: '600',
      color: '#bbb',
      fontSize: '0.7rem',
      padding: '0 4px'
    }
  };

  if (matches.length === 0) {
    return (
      <div style={styles.container}>
        <p>No matches loaded</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {matchesToShow.map(match => {
        const matchInfo = match.matchInfo;
        if (!matchInfo) return null;
        
        const currentPrediction = predictions[matchInfo.matchId];
        const isTeam1Selected = currentPrediction === matchInfo.team1?.teamId;
        const isTeam2Selected = currentPrediction === matchInfo.team2?.teamId;
        
        return (
          <div key={matchInfo.matchId} style={styles.card}>
            {/* Header */}
            <div style={styles.header}>
              <span style={styles.matchDesc}>{matchInfo.matchDesc}</span>
              <span style={styles.matchDate}>{formatDate(matchInfo.startDate)}</span>
            </div>
            
            {/* Teams - Left vs Right */}
            <div style={styles.teamsContainer}>
              {/* Team 1 */}
              <div 
                style={isTeam1Selected ? styles.teamOptionSelected : styles.teamOption}
                onClick={() => handleTeamClick(matchInfo.matchId, matchInfo.team1?.teamId, currentPrediction)}
              >
                <span style={isTeam1Selected ? styles.teamShortSelected : styles.teamShort}>
                  {matchInfo.team1?.teamSName || 'TBD'}
                </span>
                <span style={styles.teamName}>{matchInfo.team1?.teamName || 'Team 1'}</span>
              </div>
              
              {/* VS */}
              <span style={styles.vsText}>vs</span>
              
              {/* Team 2 */}
              <div 
                style={isTeam2Selected ? styles.teamOptionSelected : styles.teamOption}
                onClick={() => handleTeamClick(matchInfo.matchId, matchInfo.team2?.teamId, currentPrediction)}
              >
                <span style={isTeam2Selected ? styles.teamShortSelected : styles.teamShort}>
                  {matchInfo.team2?.teamSName || 'TBD'}
                </span>
                <span style={styles.teamName}>{matchInfo.team2?.teamName || 'Team 2'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MatchSchedule;