import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tables API
// Tables API
export const tablesApi = {
  create: (name, maxPlayers = 10) =>
    api.post("/tables", null, {
      params: { name, max_players: maxPlayers },
    }),

  list: () => api.get("/tables"),

  get: (tableId) => api.get(`/tables/${tableId}`),

  join: (tableId, username) =>
    api.post(`/tables/${tableId}/join`, null, {
      params: { username },
    }),

  leave: (tableId, sessionToken) =>
    api.post(`/tables/${tableId}/leave`, null, {
      params: { session_token: sessionToken },
    }),

  start: (tableId, sessionToken) =>
    api.post(`/tables/${tableId}/start`, null, {
      params: { session_token: sessionToken },
    }),
};

export default api;
