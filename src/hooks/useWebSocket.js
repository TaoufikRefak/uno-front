import { useEffect, useRef, useCallback } from "react";
import { useGame } from "../contexts/GameContext";
import UnoWebSocket from "../services/websocket";

export function useWebSocket() {
  const { state, dispatch } = useGame();
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(
    (tableId, sessionToken) => {
      if (!tableId || !sessionToken) {
        dispatch({
          type: "SET_ERROR",
          payload: "Missing table ID or session token",
        });
        return;
      }

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close existing connection if any
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }

      const wsUrl = `ws://localhost:8000/ws/table/${tableId}?session_token=${sessionToken}`;

      websocketRef.current = new UnoWebSocket(
        wsUrl,
        handleMessage,
        () => {
          dispatch({ type: "SET_CONNECTION_STATUS", payload: "connected" });
          console.log("WebSocket connected");
        },
        (event) => {
          dispatch({ type: "SET_CONNECTION_STATUS", payload: "disconnected" });
          console.log("WebSocket disconnected", event);

          // Only attempt to reconnect if we're not intentionally closing
          if (websocketRef.current && websocketRef.current.shouldReconnect) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect(tableId, sessionToken);
            }, 2000); // Wait 2 seconds before reconnecting
          }
        },
        (error) => {
          dispatch({
            type: "SET_ERROR",
            payload: "WebSocket connection error",
          });
          console.error("WebSocket error:", error);
        }
      );

      websocketRef.current.connect();
    },
    [dispatch]
  );

  const handleMessage = (message) => {
    console.log("Received message:", message);

    switch (message.type) {
      case "game_state":
        dispatch({ type: "SET_GAME_STATE", payload: message.data });

        // Check if game has ended
        if (message.data.status === "completed" && message.data.winner_id) {
          const winner = message.data.players.find(
            (p) => p.id === message.data.winner_id
          );
          if (winner) {
            dispatch({
              type: "SET_ERROR",
              payload: `Game over! ${winner.username} wins!`,
            });
          }
        }
        break;

      case "your_hand":
        // Update the player's hand
        dispatch({ type: "SET_HAND", payload: message.data });
        break;

      case "card_drawn":
        // Update hand with new cards
        if (message.data && message.data.cards) {
          dispatch({
            type: "UPDATE_PLAYER_HAND",
            payload: [...state.hand, ...message.data.cards],
          });
        }
        break;

      case "card_played":
      case "turn_changed":
      case "player_joined":
      case "player_left":
      case "uno_declared":
      case "uno_penalty":
      case "uno_challenge_failed":
      case "player_one_card":
        // These events will trigger a game state update from the server
        break;

      case "play_card_result":
      case "draw_card_result":
      case "start_game_result":
      case "declare_uno_result":
      case "challenge_uno_result":
        if (!message.data.success) {
          dispatch({ type: "SET_ERROR", payload: message.data.error });
        }
        break;

      case "error":
        dispatch({ type: "SET_ERROR", payload: message.data.message });
        break;

      case "pong":
        // Handle pong response
        break;

      default:
        console.log("Unhandled message type:", message.type);
    }
  };

  const sendMessage = (message) => {
    if (
      websocketRef.current &&
      websocketRef.current.getReadyState() === WebSocket.OPEN
    ) {
      return websocketRef.current.send(message);
    }
    return false;
  };

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    dispatch({ type: "SET_CONNECTION_STATUS", payload: "disconnected" });
  }, [dispatch]);

  useEffect(() => {
    if (state.table && state.sessionToken) {
      connect(state.table.id, state.sessionToken);
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [state.table, state.sessionToken, connect, disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    connectionStatus: state.connectionStatus,
  };
}
