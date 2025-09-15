import React, { useState, useEffect, useCallback } from "react";
import { tablesApi } from "../../services/api";
import { useGame } from "../../contexts/GameContext";
import "./Lobby.css";
import api from "../../services/api";
function Lobby() {
  const { state, dispatch } = useGame();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const handleAuthError = (error) => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("auth_token");
        setIsAuthenticated(false);
        dispatch({
          type: "SET_ERROR",
          payload: "Your session has expired. Please login again.",
        });
      }
    };

    // Add response interceptor
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        handleAuthError(error);
        return Promise.reject(error);
      }
    );
    return () => {
      // Remove interceptor on component unmount
      api.interceptors.response.eject(interceptor);
    };
  }, [dispatch]);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token");

    if (token) {
      localStorage.setItem("auth_token", token);
      setIsAuthenticated(true);
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check if we already have a token
      const existingToken = localStorage.getItem("auth_token");
      setIsAuthenticated(!!existingToken);
    }
  }, []);
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tablesApi.list();
      setTables(response.data);
    } catch (error) {
      console.error("Error fetching tables:", error);
      // Remove the unused 'response' variable
    } finally {
      setLoading(false);
    }
  }, []); // Add dependencies if needed

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    try {
      setLoading(true);
      // Remove the unused response variable
      await tablesApi.create(newTableName);
      setNewTableName("");
      setShowCreateForm(false);
      fetchTables(); // Refresh the table list
    } catch (error) {
      console.error("Error creating table:", error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  const joinTable = async (tableId) => {
    const token = localStorage.getItem("auth_token");

    try {
      setLoading(true);
      const config = token
        ? {
            headers: { Authorization: `Bearer ${token}` },
          }
        : {};

      const response = await tablesApi.join(tableId, username, config);

      // Handle the response correctly
      if (response.data) {
        dispatch({
          type: "SET_SESSION_TOKEN",
          payload: response.data.session_token,
        });

        // Create a player object from the response
        const playerData = {
          id: response.data.player_id,
          user_id: response.data.user_id, // <-- ADD THIS
          username: username,
          hand: [],
          is_online: true,
          role: response.data.role || "player",
        };

        dispatch({ type: "SET_PLAYER", payload: playerData });
        dispatch({ type: "SET_ROLE", payload: response.data.role || "player" }); // Set role

        // Create a table object
        const tableData = {
          id: tableId,
          name: "", // We'll get this from the table details
          players: response.data.role === "player" ? [playerData] : [], // Only add to players if not spectator
          spectators: response.data.role === "spectator" ? [playerData] : [], // Add to spectators if spectator
        };

        dispatch({ type: "SET_TABLE", payload: tableData });

        // Fetch table details to get the full table object
        try {
          const tableResponse = await tablesApi.get(tableId);
          if (tableResponse.data && tableResponse.data.table) {
            dispatch({ type: "SET_TABLE", payload: tableResponse.data.table });
          }

          if (tableResponse.data && tableResponse.data.game_state) {
            dispatch({
              type: "SET_GAME_STATE",
              payload: tableResponse.data.game_state,
            });
          }
        } catch (error) {
          console.error("Error fetching table details:", error);
        }
      }
    } catch (error) {
      console.error("Error joining table:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to join table" });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleLogin = () => {
    // Redirect to Google login endpoint with redirect back to lobby
    window.location.href =
      "http://localhost:8000/auth/google/login?redirect_url=http://localhost:3000";
  };
  const handleAddBot = async (tableId) => {
    try {
      setLoading(true);
      await tablesApi.addBot(tableId);
      // After adding a bot, the game_state broadcast should update the UI,
      // but fetching tables again is a good fallback.
      fetchTables();
    } catch (error) {
      console.error("Error adding bot:", error);
      dispatch({
        type: "SET_ERROR",
        payload: error.response?.data?.detail || "Failed to add bot",
      });
    } finally {
      setLoading(false);
    }
  };
  // Add this useEffect to check for existing auth token

  return (
    <div className="lobby">
      <h1>UNO Game Lobby</h1>

      {/* Google Login Button - only show if not authenticated */}
      {!isAuthenticated && (
        <div className="google-login-section">
          <button onClick={handleGoogleLogin} className="google-login-btn">
            <img src="/google-logo.png" alt="Google" />
            <span>Sign in with Google</span>
          </button>
          <p>Or join as a guest below</p>
        </div>
      )}

      {/* Show user info if authenticated */}
      {isAuthenticated && (
        <div className="user-info">
          <p>Logged in with Google</p>
          <button
            onClick={() => {
              localStorage.removeItem("auth_token");
              setIsAuthenticated(false);
            }}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      )}

      {state.error && (
        <div className="error-message">
          {state.error}
          <button onClick={() => dispatch({ type: "CLEAR_ERROR" })}>
            Dismiss
          </button>
        </div>
      )}

      <div className="username-section">
        <label htmlFor="username">Your Username:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
      </div>

      <div className="tables-section">
        <div className="section-header">
          <h2>Available Tables</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="create-table-btn"
          >
            {showCreateForm ? "Cancel" : "Create New Table"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={createTable} className="create-table-form">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Table name"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Table"}
            </button>
          </form>
        )}

        {loading ? (
          <p>Loading tables...</p>
        ) : tables.length === 0 ? (
          <p>No tables available. Create one!</p>
        ) : (
          <div className="tables-list">
            {tables.map((table) => (
              <div key={table.id} className="table-item">
                <div className="table-info">
                  <h3>{table.name}</h3>
                  <p>
                    Players: {table.player_count}/{table.max_players}
                  </p>
                  <p>Status: {table.status}</p>
                </div>
                <div className="table-actions">
                  <button
                    onClick={() => joinTable(table.id)}
                    disabled={
                      table.player_count >= table.max_players ||
                      table.status !== "waiting"
                    }
                    className="join-table-btn"
                  >
                    {table.player_count >= table.max_players
                      ? "Full"
                      : table.status !== "waiting"
                      ? "Game in progress"
                      : "Join Table"}
                  </button>
                  {table.status === "waiting" &&
                    table.player_count < table.max_players && (
                      <button
                        onClick={() => handleAddBot(table.id)}
                        className="add-bot-btn"
                        disabled={loading}
                      >
                        Add Bot
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
