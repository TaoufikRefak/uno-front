import React, { createContext, useContext, useReducer } from "react";

const GameContext = createContext();

const initialState = {
  connectionStatus: "disconnected",
  player: null,
  table: null,
  gameState: null,
  hand: [],
  sessionToken: localStorage.getItem("uno_session_token") || null,
  error: null,
  loading: false,
  role: "player", // Add role field
};

function gameReducer(state, action) {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, role: action.payload };
    case "ADD_CARDS_TO_HAND":
      return {
        ...state,
        hand: [...state.hand, ...action.payload],
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "SET_SESSION_TOKEN":
      localStorage.setItem("uno_session_token", action.payload);
      return { ...state, sessionToken: action.payload };

    case "SET_PLAYER":
      return { ...state, player: action.payload };

    case "SET_TABLE":
      return { ...state, table: action.payload };

    case "SET_GAME_STATE":
      return { ...state, gameState: action.payload };

    case "SET_HAND":
      return { ...state, hand: action.payload || [] };

    case "UPDATE_PLAYER_HAND":
      return { ...state, hand: action.payload };

    case "SET_CONNECTION_STATUS":
      return { ...state, connectionStatus: action.payload };

    case "RESET_GAME":
      localStorage.removeItem("uno_session_token");
      return {
        ...initialState,
        sessionToken: null,
        connectionStatus: "disconnected",
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
