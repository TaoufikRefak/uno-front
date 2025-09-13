class UnoWebSocket {
  constructor(url, onMessage, onOpen, onClose, onError) {
    this.url = url;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;
    this.ws = null;
    this.reconnectInterval = 20000; // Start with 2 seconds
    this.maxReconnectInterval = 30000; // Max 30 seconds
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
    this.isConnecting = false;
    this.reconnectTimeout = null;
  }

  connect() {
    if (this.isConnecting) {
      console.log("Already connecting, skipping...");
      return;
    }

    this.isConnecting = true;

    try {
      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectInterval = 2000; // Reset to initial value
        this.onOpen && this.onOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        console.log("WebSocket closed:", event);
        this.onClose && this.onClose(event);

        // Only attempt to reconnect if we should
        if (this.shouldReconnect) {
          this.reconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        console.error("WebSocket error:", error);
        this.onError && this.onError(error);
      };
    } catch (error) {
      this.isConnecting = false;
      console.error("WebSocket connection error:", error);

      // Only attempt to reconnect if we should
      if (this.shouldReconnect) {
        this.reconnect();
      }
    }
  }

  reconnect() {
    if (!this.shouldReconnect) return;

    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
      this.maxReconnectInterval
    );

    console.log(
      `Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    }
    console.error("WebSocket is not connected");
    return false;
  }

  close() {
    this.shouldReconnect = false;

    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getReadyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}

export default UnoWebSocket;
