import React from "react";
import "./PlayerList.css";

function PlayerList({ players, spectators = [], currentPlayerId }) {
  return (
    <div className="player-list">
      <h3>Players</h3>
      <ul>
        {players.map((player) => (
          <li
            key={player.id}
            className={player.id === currentPlayerId ? "current-player" : ""}
          >
            <span className="player-name">{player.username}</span>
            <span className="player-cards">{player.hand_count} cards</span>
            {player.uno_declaration === "declared" && (
              <span className="uno-badge">UNO!</span>
            )}
            {!player.is_online && (
              <span className="offline-badge">Offline</span>
            )}
          </li>
        ))}
      </ul>

      {spectators.length > 0 && (
        <>
          <h4>Spectators</h4>
          <ul>
            {spectators.map((spectator) => (
              <li key={spectator.id}>
                <span className="spectator-name">{spectator.username}</span>
                <span className="spectator-badge">👁️</span>
                {!spectator.is_online && (
                  <span className="offline-badge">Offline</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
export default PlayerList;
