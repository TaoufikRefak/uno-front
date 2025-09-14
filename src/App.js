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
  const { state, dispatch } = useGame();
  const { sendMessage, isConnected, connectionStatus } = useWebSocket();
  useEffect(() => {
    if (
      connectionStatus === "disconnected" &&
      state.table &&
      state.sessionToken
    ) {
      console.log("Attempting to connect WebSocket...");
      // The useWebSocket hook will automatically handle reconnection
    }
  }, [connectionStatus, state.table, state.sessionToken]);

  const handleStartGame = () => {
    console.log("Start Game button clicked");
    if (!isConnected) {
      console.log("Not connected to WebSocket");
      dispatch({
        type: "SET_ERROR",
        payload: "Not connected to the game server. Please wait...",
      });
      return;
    }

    console.log("Sending start_game message");
    sendMessage({
      type: "start_game",
    });
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token");
    if (token) {
      localStorage.setItem("auth_token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Add a check for spectator role
  const isSpectator = state.role === "spectator";

  // Add loading state check
  if (!state.table || !state.gameState) {
    return <Lobby />;
  }

  // Safe access to gameState properties
  const gameState = state.gameState || {};
  const table = state.table || {};

  // Disable game actions for spectators
  const handlePlayCard = (cardIndex, chosenColor) => {
    if (isSpectator) {
      dispatch({ type: "SET_ERROR", payload: "Spectators cannot play cards" });
      return;
    }
    sendMessage({
      type: "play_card",
      card_index: cardIndex,
      chosen_color: chosenColor,
    });
  };

  const handleDrawCard = () => {
    if (isSpectator) {
      dispatch({ type: "SET_ERROR", payload: "Spectators cannot draw cards" });
      return;
    }
    sendMessage({
      type: "draw_card",
    });
  };

  const handleDeclareUno = () => {
    if (isSpectator) {
      dispatch({ type: "SET_ERROR", payload: "Spectators cannot declare UNO" });
      return;
    }
    sendMessage({
      type: "declare_uno",
    });
  };

  const handleChallengeUno = (playerId) => {
    if (isSpectator) {
      dispatch({
        type: "SET_ERROR",
        payload: "Spectators cannot challenge UNO",
      });
      return;
    }
    sendMessage({
      type: "challenge_uno",
      target_player_id: playerId,
    });
  };

  // Safe topCard access
  const topCard =
    gameState.discard_top ||
    (gameState.discard_pile && gameState.discard_pile.length > 0
      ? gameState.discard_pile[gameState.discard_pile.length - 1]
      : null);

  // Check if current player is the table creator
  const isCreator =
    table.creator_id && state.player && state.player.id === table.creator_id;

  const isCurrentPlayer =
    state.player && gameState.current_player_id === state.player.id;

  const canDeclareUno =
    state.player &&
    state.player.hand_count === 1 &&
    state.player.uno_declaration === "pending";

  // Check if any player has 1 card but hasn't declared UNO
  const canChallengeUno =
    gameState.players &&
    gameState.players.some(
      (player) =>
        player.hand_count === 1 &&
        player.uno_declaration !== "declared" &&
        player.id !== state.player.id
    );

  // Get current player count
  const playerCount = table.players ? table.players.length : 0;
  const maxPlayers = table.max_players || 10;

  return (
    <div className="game-table">
      <header className="game-header">
        <h1>UNO Game - Table: {table.name}</h1>
        {isSpectator && <div className="spectator-badge">SPECTATOR</div>}
        <div className="connection-status">
          Status: {isConnected ? "Connected" : "Disconnected"}
        </div>
        <div className="game-status">
          Status: {gameState.status || "loading"}
          <span className={`connection-status ${state.connectionStatus}`}>
            ({state.connectionStatus})
          </span>
          {gameState.status === "completed" && gameState.winner_id && (
            <span>
              {" "}
              - Winner:{" "}
              {
                gameState.players.find((p) => p.id === gameState.winner_id)
                  ?.username
              }
            </span>
          )}
          {gameState.current_player_id && (
            <span>
              {" "}
              - Current Player:{" "}
              {
                gameState.players.find(
                  (p) => p.id === gameState.current_player_id
                )?.username
              }
            </span>
          )}
        </div>
      </header>

      <div className="game-content">
        <div className="game-sidebar">
          <PlayerList
            players={gameState.players || []}
            spectators={gameState.spectators || []}
            currentPlayerId={gameState.current_player_id}
          />

          <DiscardPile topCard={topCard} />

          {!isSpectator && (
            <GameControls
              onDrawCard={handleDrawCard}
              onDeclareUno={handleDeclareUno}
              onChallengeUno={handleChallengeUno}
              canDeclareUno={canDeclareUno}
              canChallengeUno={canChallengeUno}
              isCurrentPlayer={isCurrentPlayer}
              gameStatus={gameState.status}
            />
          )}
        </div>

        <div className="game-main">
          {isSpectator ? (
            <div className="spectator-view">
              <h3>Spectator View</h3>
              <p>You are watching this game as a spectator.</p>
              <p>You cannot participate in the game actions.</p>
            </div>
          ) : (
            <PlayerHand
              cards={state.hand}
              onPlayCard={handlePlayCard}
              topCard={topCard}
            />
          )}
        </div>
      </div>

      {gameState.status === "waiting" && !isSpectator && (
        <div className="start-game-prompt">
          <p>
            Waiting for players to join... ({playerCount}/{maxPlayers})
          </p>

          <button onClick={handleStartGame} className="start-game-button">
            START GAME
          </button>

          {isCreator && playerCount < 2 && (
            <p className="waiting-message">Need at least 2 players to start</p>
          )}
        </div>
      )}

      {gameState.status === "completed" && (
        <div className="game-over-prompt">
          <h2>Game Over!</h2>
          {gameState.winner_id && (
            <p>
              Winner:{" "}
              {
                gameState.players.find((p) => p.id === gameState.winner_id)
                  ?.username
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
