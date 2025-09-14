import { useEffect, useRef, useCallback, useState } from "react";
import { useGame } from "../contexts/GameContext";
import UnoWebSocket from "../services/websocket";

export function useWebSocket() {
  const { state, dispatch } = useGame();
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback(
    (message) => {
      console.log("WebSocket message received:", message);

      console.log("Received message:", message);

      switch (message.type) {
        case "role_assigned":
          dispatch({ type: "SET_ROLE", payload: message.data.role });
          break;
        case "game_state":
          dispatch({ type: "SET_GAME_STATE", payload: message.data });
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
          dispatch({ type: "SET_HAND", payload: message.data });
          break;
        case "card_drawn":
          if (message.data && message.data.cards) {
            dispatch({
              type: "ADD_CARDS_TO_HAND",
              payload: message.data.cards,
            });
          }
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
        default:
          console.log("Unhandled message type:", message.type);
      }
    },
    [dispatch]
  );

  const connect = useCallback(
    (tableId, sessionToken) => {
      console.log(
        "Connecting to WebSocket with table:",
        tableId,
        "session:",
        sessionToken
      );

      // Don't reconnect if already connected/connecting
      if (
        websocketRef.current &&
        (websocketRef.current.getReadyState() === WebSocket.OPEN ||
          websocketRef.current.getReadyState() === WebSocket.CONNECTING)
      ) {
        console.log("WebSocket already connected or connecting, skipping...");
        return;
      }

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

      const wsUrl = `ws://${window.location.hostname}:8000/ws/table/${tableId}?session_token=${sessionToken}`;

      websocketRef.current = new UnoWebSocket(
        wsUrl,
        handleMessage,
        () => {
          setIsConnected(true);
          dispatch({ type: "SET_CONNECTION_STATUS", payload: "connected" });
          console.log("WebSocket connected");
        },
        (event) => {
          setIsConnected(false);
          dispatch({ type: "SET_CONNECTION_STATUS", payload: "disconnected" });
          console.log("WebSocket disconnected", event);

          // Only attempt to reconnect if we're not intentionally closing
          if (websocketRef.current && websocketRef.current.shouldReconnect) {
            console.log("Scheduling reconnection in 5 seconds...");
            reconnectTimeoutRef.current = setTimeout(() => {
              connect(tableId, sessionToken);
            }, 5000);
          }
        },
        (error) => {
          setIsConnected(false);
          dispatch({
            type: "SET_ERROR",
            payload: "WebSocket connection error",
          });
          console.error("WebSocket error:", error);
        }
      );

      websocketRef.current.connect();
    },
    [dispatch, handleMessage]
  );

  const sendMessage = useCallback((message) => {
    if (
      websocketRef.current &&
      websocketRef.current.getReadyState() === WebSocket.OPEN
    ) {
      return websocketRef.current.send(message);
    }
    console.error("WebSocket is not connected, cannot send message");
    return false;
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.shouldReconnect = false;
      websocketRef.current.close();
      websocketRef.current = null;
    }

    dispatch({ type: "SET_CONNECTION_STATUS", payload: "disconnected" });
  }, [dispatch]);

  // Connect when table and session token are available
  useEffect(() => {
    if (state.table && state.sessionToken) {
      console.log("Connecting to WebSocket...");
      connect(state.table.id, state.sessionToken);
    }

    return () => {
      console.log("Cleaning up WebSocket connection...");
      disconnect();
    };
  }, [state.table, state.sessionToken, connect, disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    connectionStatus: state.connectionStatus,
    isConnected,
  };
}
