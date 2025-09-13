import React, { useState, useEffect, useCallback } from "react";
import { tablesApi } from "../../services/api";
import { useGame } from "../../contexts/GameContext";
import "./Lobby.css";

function Lobby() {
  const { state, dispatch } = useGame();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [username, setUsername] = useState("");

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
    if (!username.trim()) {
      dispatch({ type: "SET_ERROR", payload: "Please enter a username" });
      return;
    }

    try {
      setLoading(true);
      const response = await tablesApi.join(tableId, username);

      // Handle the response correctly
      if (response.data) {
        dispatch({
          type: "SET_SESSION_TOKEN",
          payload: response.data.session_token,
        });

        // Create a player object from the response
        const playerData = {
          id: response.data.player_id,
          username: username,
          hand: [],
          is_online: true,
        };

        dispatch({ type: "SET_PLAYER", payload: playerData });

        // Create a table object
        const tableData = {
          id: tableId,
          name: "", // We'll get this from the table details
          players: [playerData], // Start with the current player
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

  return (
    <div className="lobby">
      <h1>UNO Game Lobby</h1>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
