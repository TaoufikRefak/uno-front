import React from "react";
import "./GameControls.css";

function GameControls({
  onDrawCard,
  onDeclareUno,
  onChallengeUno,
  canDeclareUno,
  canChallengeUno,
  isCurrentPlayer,
  gameStatus,
}) {
  return (
    <div className="game-controls">
      <h3>Game Controls</h3>

      {isCurrentPlayer && gameStatus === "in_progress" && (
        <div className="player-controls">
          <button onClick={onDrawCard} className="control-button draw">
            Draw Card
          </button>

          {canDeclareUno && (
            <button onClick={onDeclareUno} className="control-button uno">
              Declare UNO!
            </button>
          )}
        </div>
      )}

      {canChallengeUno && (
        <div className="challenge-controls">
          <p>A player might have forgotten to declare UNO!</p>
          <button onClick={onChallengeUno} className="control-button challenge">
            Challenge UNO
          </button>
        </div>
      )}
    </div>
  );
}

export default GameControls;
