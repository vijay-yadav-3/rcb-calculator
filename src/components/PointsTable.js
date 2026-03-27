import React from 'react';
import './PointsTable.css';

const PointsTable = ({ teams }) => {
  const getPlayoffPosition = (index) => {
    if (index < 4) return 'playoff';
    if (index === 4) return 'fifth';
    return 'eliminated';
  };

  const getPositionText = (index) => {
    if (index < 4) return 'Playoffs';
    if (index === 4) return '5th Place';
    return 'Eliminated';
  };

  return (
    <div className="points-table">
      <div className="table-header">
        <div className="pos-col">Pos</div>
        <div className="team-col">Team</div>
        <div className="matches-col">M</div>
        <div className="won-col">W</div>
        <div className="lost-col">L</div>
        <div className="points-col">Pts</div>
        <div className="nrr-col">NRR</div>
        <div className="status-col">Status</div>
      </div>
      
      <div className="table-body">
        {teams.map((team, index) => (
          <div 
            key={team.teamId} 
            className={`table-row ${getPlayoffPosition(index)}`}
          >
            <div className="pos-col">{index + 1}</div>
            <div className="team-col">
              <div className="team-info">
                <span className="team-short">{team.teamName}</span>
                <span className="team-full">{team.teamFullName}</span>
              </div>
            </div>
            <div className="matches-col">{team.matchesPlayed || 0}</div>
            <div className="won-col">{team.matchesWon || 0}</div>
            <div className="lost-col">{team.matchesLost || 0}</div>
            <div className="points-col">{team.points || 0}</div>
            <div className="nrr-col">{team.nrr || '0.000'}</div>
            <div className="status-col">
              <span className={`status-badge ${getPlayoffPosition(index)}`}>
                {getPositionText(index)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PointsTable;