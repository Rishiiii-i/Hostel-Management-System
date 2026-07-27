const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class ChatService {
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getRooms() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/rooms`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
      throw new Error('Failed to fetch rooms');
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getMessages(roomId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/rooms/${roomId}/messages`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
      throw new Error('Failed to fetch messages');
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async startDM(recipientEmail) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/rooms/dm`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ recipientEmail })
      });
      if (res.ok) return await res.json();
      throw new Error('Failed to start direct message');
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async searchUsers(search) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/users?search=${encodeURIComponent(search)}`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
      throw new Error('Failed to query users');
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async markRoomAsRead(roomId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/rooms/${roomId}/read`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
      throw new Error('Failed to mark room as read');
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async sendMessage(roomId, text, attachment = null) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ text, attachment })
      });
      if (res.ok) return await res.json();
      throw new Error('Failed to send message');
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async deleteRoom(roomId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
      throw new Error('Failed to delete conversation');
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}

export const chatService = new ChatService();
