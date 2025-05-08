import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(user, serverUrl = process.env.REACT_APP_SOCKET_URL) {
    if (this.socket) return;

    this.socket = io(serverUrl, {
      auth: {
        token: localStorage.getItem("authToken")
      }
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Add other global handlers
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomName, userData) {
    if (!this.socket) return;
    this.socket.emit("joinRoom", { room: roomName, ...userData });
  }

  leaveRoom(roomName) {
    if (!this.socket) return;
    this.socket.emit("leaveRoom", { room: roomName });
  }

  sendMessage(messageData) {
    if (!this.socket) return false;
    this.socket.emit("sendMessage", messageData);
    return true;
  }

  onNewMessage(callback) {
    if (!this.socket) return () => {};
    this.socket.on("newMessage", callback);
    return () => this.socket.off("newMessage", callback);
  }

  // Additional methods for typing indicators, etc.
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;