import React, { useEffect } from "react";
import { GameProvider, useGame } from "./contexts/GameContext";
import { useWebSocket } from "./hooks/useWebSocket";
import PlayerHand from "./components/PlayerHand/PlayerHand";
import DiscardPile from "./components/DiscardPile/DiscardPile";
import PlayerList from "./components/PlayerList/PlayerList";
import GameControls from "./components/GameControls/GameControls";
import Lobby from "./components/Lobby/Lobby";
import "./App.css";

function GameTable() {
  const { state } = useGame();
  const { connect, sendMessage } = useWebSocket();

  const handlePlayCard = (cardIndex, chosenColor) => {
    sendMessage({
      type: "play_card",
      card_index: cardIndex,
      chosen_color: chosenColor,
    });
  };

  const handleDrawCard = () => {
    sendMessage({
      type: "draw_card",
    });
  };

  const handleDeclareUno = () => {
    sendMessage({
      type: "declare_uno",
    });
  };

  const handleChallengeUno = (playerId) => {
    sendMessage({
      type: "challenge_uno",
      target_player_id: playerId,
    });
  };

  const handleStartGame = () => {
    sendMessage({
      type: "start_game",
    });
  };

  if (!state.table || !state.gameState) {
    return <Lobby />;
  }

  const topCard =
    state.gameState.discard_top ||
    (state.gameState.discard_pile && state.gameState.discard_pile.length > 0
      ? state.gameState.discard_pile[state.gameState.discard_pile.length - 1]
      : null);

  // Check if current player is the table creator (first player)
  const isCreator =
    state.table.players &&
    state.table.players.length > 0 &&
    state.player &&
    state.player.id === state.table.players[0].id;

  const isCurrentPlayer =
    state.player && state.gameState.current_player_id === state.player.id;
  const canDeclareUno =
    state.player &&
    state.player.hand_count === 1 &&
    state.player.uno_declaration === "pending";

  // Check if any player has 1 card but hasn't declared UNO
  const canChallengeUno =
    state.gameState.players &&
    state.gameState.players.some(
      (player) =>
        player.hand_count === 1 &&
        player.uno_declaration !== "declared" &&
        player.id !== state.player.id
    );

  // Get current player count
  const playerCount = state.table.players ? state.table.players.length : 0;
  const maxPlayers = state.table.max_players || 10;

  return (
    <div className="game-table">
      <header className="game-header">
        <h1>UNO Game - Table: {state.table.name}</h1>
        <div className="game-status">
          Status: {state.gameState.status}
          {state.gameState.status === "completed" &&
            state.gameState.winner_id && (
              <span>
                {" "}
                - Winner:{" "}
                {
                  state.gameState.players.find(
                    (p) => p.id === state.gameState.winner_id
                  )?.username
                }
              </span>
            )}
          {state.gameState.current_player_id && (
            <span>
              {" "}
              - Current Player:{" "}
              {
                state.gameState.players.find(
                  (p) => p.id === state.gameState.current_player_id
                )?.username
              }
            </span>
          )}
        </div>
      </header>

      <div className="game-content">
        <div className="game-sidebar">
          <PlayerList
            players={state.gameState.players}
            currentPlayerId={state.gameState.current_player_id}
          />

          <DiscardPile topCard={topCard} />

          <GameControls
            onDrawCard={handleDrawCard}
            onDeclareUno={handleDeclareUno}
            onChallengeUno={handleChallengeUno}
            canDeclareUno={canDeclareUno}
            canChallengeUno={canChallengeUno}
            isCurrentPlayer={isCurrentPlayer}
            gameStatus={state.gameState.status}
          />
        </div>

        <div className="game-main">
          <PlayerHand
            cards={state.hand}
            onPlayCard={handlePlayCard}
            topCard={topCard}
          />
        </div>
      </div>

      {state.gameState.status === "waiting" && (
        <div className="start-game-prompt">
          <p>
            Waiting for players to join... ({playerCount}/{maxPlayers})
          </p>
          {isCreator && (
            <button onClick={handleStartGame} className="start-game-button">
              Start Game
            </button>
          )}
          {isCreator && playerCount < 2 && (
            <p className="waiting-message">Need at least 2 players to start</p>
          )}
        </div>
      )}

      {state.gameState.status === "completed" && (
        <div className="game-over-prompt">
          <h2>Game Over!</h2>
          {state.gameState.winner_id && (
            <p>
              Winner:{" "}
              {
                state.gameState.players.find(
                  (p) => p.id === state.gameState.winner_id
                )?.username
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <div className="App">
        <GameTable />
      </div>
    </GameProvider>
  );
}

export default App;
