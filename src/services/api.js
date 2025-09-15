import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired, remove it from localStorage
      localStorage.removeItem("auth_token");
      window.location.reload(); // Reload the page to reset the state
    }
    return Promise.reject(error);
  }
);
// Tables API
export const tablesApi = {
  create: (name, maxPlayers = 10) =>
    api.post("/tables", null, {
      params: { name, max_players: maxPlayers },
    }),
  addBot: (tableId) => api.post(`/tables/${tableId}/add_bot`), // <-- ADD THIS LINE

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
