import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Chat.css';
import Icon from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import searchIcon from '../../assets/icons/search.png';
import checkmarkIcon from '../../assets/icons/checkmark.png';
import trashIcon from '../../assets/icons/trash.png';
import paperclipIcon from '../../assets/icons/paperclip.png';
import sendIcon from '../../assets/icons/send.png';
import chatIcon from '../../assets/icons/chat.png';
import deliveredIcon from '../../assets/icons/delivered.png';
import readIcon from '../../assets/icons/read.png';

export default function Chat() {
  const { user } = useAuth();
  const currentUserEmail = user?.email?.toLowerCase();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // search and new dm state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const fileInputRef = useRef(null);

  // scroll reference
  const messageEndRef = useRef(null);

  // initial rooms load
  useEffect(() => {
    loadRooms();
  }, []);

  // check rooms every five seconds
  useEffect(() => {
    const roomsInterval = setInterval(() => {
      loadRooms();
    }, 5000);

    return () => clearInterval(roomsInterval);
  }, []);

  // check active messages every three seconds
  useEffect(() => {
    let active = true;

    if (activeRoom) {
      // get messages right away
      loadMessages(activeRoom.id);
      
      // set read status on database
      chatService.markRoomAsRead(activeRoom.id);
      
      // clear local unread number
      setRooms(prev => 
        prev.map(r => r.id === activeRoom.id ? { ...r, unreadCount: 0 } : r)
      );

      // start polling for messages
      const messagesInterval = setInterval(() => {
        if (active) {
          loadMessages(activeRoom.id);
        }
      }, 3000);

      return () => {
        active = false;
        clearInterval(messagesInterval);
      };
    }
  }, [activeRoom?.id]);

  // scroll down when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // get chat rooms
  const loadRooms = async () => {
    const data = await chatService.getRooms();
    setRooms(data);
  };

  // get messages
  const loadMessages = async (roomId) => {
    const data = await chatService.getMessages(roomId);
    
    // do not update state if data is same
    setMessages(prev => {
      if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
      return data;
    });
  };

  // send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeRoom) return;
    if (!inputText.trim() && !selectedFile) return;

    let attachmentPayload = null;
    if (selectedFile) {
      attachmentPayload = {
        name: selectedFile.name,
        type: selectedFile.type,
        url: filePreview
      };
    }

    const messageText = inputText;
    setInputText('');
    setSelectedFile(null);
    setFilePreview('');

    // send message through api
    const newMsg = await chatService.sendMessage(activeRoom.id, messageText, attachmentPayload);
    if (newMsg) {
      setMessages(prev => [...prev, newMsg]);
      loadRooms(); // update room preview
    }
  };

  // search users
  useEffect(() => {
    if (showNewChatModal) {
      fetchUsers(userSearchQuery);
    }
  }, [userSearchQuery, showNewChatModal]);

  const fetchUsers = async (query) => {
    setSearching(true);
    const data = await chatService.searchUsers(query);
    setSearchResults(data);
    setSearching(false);
  };

  // start new direct message
  const handleStartDM = async (recipientEmail) => {
    const room = await chatService.startDM(recipientEmail);
    if (room) {
      setActiveRoom(room);
      setShowNewChatModal(false);
      setUserSearchQuery('');
      loadRooms();
    }
  };

  // delete current chat
  const handleDeleteConversation = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This will permanently erase all message history.')) {
      return;
    }
    const result = await chatService.deleteRoom(roomId);
    if (result) {
      setActiveRoom(null);
      setMessages([]);
      loadRooms();
    }
  };

  // upload file file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // add quick emoji
  const handleQuickEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  // group messages by date
  const groupMessagesByDate = (messagesList) => {
    const groups = {};
    messagesList.forEach((m) => {
      const date = new Date(m.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateString = '';
      if (date.toDateString() === today.toDateString()) {
        dateString = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateString = 'Yesterday';
      } else {
        dateString = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(m);
    });
    return groups;
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const groupedMsgs = groupMessagesByDate(messages);

  // dm only mode

  return (
    <div className="chat-workspace-container animate-fade-in-slide-up">
      {/* left sidebar chats */}
      <div className="chat-sidebar-panel">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">
            <h3>Direct Messages</h3>
            <button 
              type="button" 
              className="btn-new-dm-trigger"
              onClick={() => setShowNewChatModal(true)}
              title="Start new DM"
            >
              <img src={checkmarkIcon} alt="new dm" className="icon-img" style={{ width: '14px', height: '14px', transform: 'rotate(45deg) scale(1.1)', filter: 'brightness(0) invert(1)' }} />
              <span>New DM</span>
            </button>
          </div>
        </div>

        <div className="chat-sidebar-search">
          <div className="search-input-wrapper">
            <img src={searchIcon} alt="search" className="icon-img" style={{ width: '14px', height: '14px' }} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                setRooms(prev => 
                  prev.map(r => ({
                    ...r,
                    hidden: !r.name.toLowerCase().includes(q)
                  }))
                );
              }}
            />
          </div>
        </div>

        {/* rooms list */}
        <div className="rooms-scroll-list">
          {/* direct messages */}
          <div className="rooms-group">
            <div className="group-title">Active Conversations</div>
            {rooms.filter(r => r.type === 'dm' && !r.hidden).length === 0 ? (
              <p className="no-rooms-placeholder">No active direct messages. Click 'New DM' to start chatting.</p>
            ) : (
              rooms.filter(r => r.type === 'dm' && !r.hidden).map((room) => {
                const recipientName = room.recipient?.name || 'User';
                const initials = recipientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <button
                    key={room.id}
                    type="button"
                    className={`room-item-btn ${activeRoom?.id === room.id ? 'active' : ''}`}
                    onClick={() => setActiveRoom(room)}
                  >
                    <div className="room-meta">
                      <div className="avatar-wrapper">
                        {room.recipient?.photo ? (
                          <img src={room.recipient.photo} alt={recipientName} className="avatar-img" />
                        ) : (
                          <div className="avatar-initials-circle">{initials}</div>
                        )}
                        <span className="online-status-dot online"></span>
                      </div>
                      <div className="room-info">
                        <span className="room-name">{recipientName}</span>
                        <span className="room-preview-text">
                          {room.lastMessage && room.lastMessage.text ? room.lastMessage.text : 'Start chatting!'}
                        </span>
                      </div>
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="room-unread-badge">{room.unreadCount}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* right workspace active chat screen */}
      <div className="chat-workspace-feed">
        {activeRoom ? (
          <>
            {/* active room header */}
            <div className="chat-header-bar">
              <div className="active-room-details">
                <div className="active-avatar-wrapper">
                  {activeRoom.recipient?.photo ? (
                    <img src={activeRoom.recipient.photo} alt={activeRoom.name} className="active-avatar" />
                  ) : (
                    <div className="active-initials-circle">
                      {activeRoom.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="online-status-dot online"></span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4>{activeRoom.name}</h4>
                    <span className={`role-badge ${activeRoom.recipient?.role || 'student'}`}>
                      {activeRoom.recipient?.role || 'Student'}
                    </span>
                  </div>
                  <p className="online-text">
                    Active conversation {activeRoom.recipient?.room && `• Room ${activeRoom.recipient.room}`}
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                className="btn-delete-chat"
                onClick={() => handleDeleteConversation(activeRoom.id)}
                title="Delete conversation"
              >
                <img src={trashIcon} alt="delete" className="icon-img" style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* messages thread */}
            <div className="chat-messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat-welcome">
                  <div className="welcome-chat-icon">
                    <img src={chatIcon} alt="chat" className="icon-img" style={{ width: '40px', height: '40px' }} />
                  </div>
                  <h3>No messages yet with {activeRoom.name}</h3>
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                Object.keys(groupedMsgs).map((dateGroup) => (
                  <div key={dateGroup} className="messages-date-group">
                    <div className="date-separator">
                      <span>{dateGroup}</span>
                    </div>

                    {groupedMsgs[dateGroup].map((msg) => {
                      const isSelf = msg.senderEmail.toLowerCase() === currentUserEmail;
                      const senderInitials = msg.senderName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                      return (
                        <div key={msg._id || msg.id} className={`message-row ${isSelf ? 'self' : 'other'}`}>
                          {!isSelf && (
                            <div className="message-avatar">
                              <div className="small-initials-circle">{senderInitials}</div>
                            </div>
                          )}
                          <div className="message-content-block">
                            {!isSelf && activeRoom.type === 'channel' && (
                              <div className="message-sender-name">
                                {msg.senderName}
                                <span className={`mini-role-badge ${msg.senderRole}`}>
                                  {msg.senderRole}
                                </span>
                              </div>
                            )}

                            <div className="message-bubble-wrapper">
                              <div className="message-bubble">
                                {/* file */}
                                {msg.attachment && (
                                  <div className="message-attachment-card">
                                    {msg.attachment.type.startsWith('image/') ? (
                                      <img src={msg.attachment.url} alt={msg.attachment.name} className="attached-image-preview" />
                                    ) : (
                                      <div className="generic-file-attachment">
                                        <img src={paperclipIcon} alt="file" className="icon-img" style={{ width: '20px', height: '20px' }} />
                                        <div className="file-info-text">
                                          <span>{msg.attachment.name}</span>
                                          <a href={msg.attachment.url} download={msg.attachment.name}>Download</a>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {msg.text && <p>{msg.text}</p>}
                              </div>
                              <div className="message-timestamp">
                                <span>{formatTime(msg.createdAt)}</span>
                                {isSelf && (
                                  <span className="delivery-ticks" title={msg.readBy.length > 1 ? "Read by recipient" : "Delivered"}>
                                    {msg.readBy.length > 1 ? (
                                      <img src={readIcon} alt="read" style={{ width: '15px', height: '15px' }} />
                                    ) : (
                                      <img src={deliveredIcon} alt="delivered" style={{ width: '14px', height: '14px' }} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              <div ref={messageEndRef} />
            </div>

            {/* send message bar */}
            <div className="chat-input-bar">
              {/* file preview box */}
              {selectedFile && (
                <div className="input-attachment-preview">
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={filePreview} alt="upload preview" />
                  ) : (
                    <div className="generic-preview-icon">
                      <img src={paperclipIcon} alt="file" className="icon-img" style={{ width: '20px', height: '20px' }} />
                      <span>{selectedFile.name}</span>
                    </div>
                  )}
                  <button type="button" className="btn-remove-attach" onClick={() => { setSelectedFile(null); setFilePreview(''); }}>
                    &times;
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="message-form">
                {/* emoji quick drawer */}
                <div className="quick-emojis">
                  {['👍', '❤️', '😂', '🔥', '👏', '🙌', '💡', '✅'].map(emoji => (
                    <button 
                      key={emoji}
                      type="button" 
                      className="emoji-btn" 
                      onClick={() => handleQuickEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="input-controls-row">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf,text/plain"
                  />
                  
                  <button 
                    type="button" 
                    className="btn-attach" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                  >
                    <img src={paperclipIcon} alt="attach" className="icon-img" style={{ width: '20px', height: '20px' }} />
                  </button>

                  <input
                    type="text"
                    className="chat-text-input"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />

                  <button type="submit" className="btn-send-message" title="Send message">
                    <img src={sendIcon} alt="send" className="icon-img" style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="feed-unselected-welcome">
            <div className="welcome-graphic">
              <img src={chatIcon} alt="chat" className="icon-img" style={{ width: '64px', height: '64px', opacity: 0.6 }} />
            </div>
            <h3>Smart Hostel Chat Hub</h3>
            <p>Select a conversation from the sidebar to begin communicating.</p>
          </div>
        )}
      </div>

      {/* new dm modal */}
      {showNewChatModal && createPortal(
        <div className="modal-backdrop new-dm-modal animate-fade-in">
          <div className="modal-box animate-scale-in">
            <div className="modal-header">
              <h3>Start a Conversation</h3>
              <button type="button" className="btn-close-modal" onClick={() => { setShowNewChatModal(false); setUserSearchQuery(''); }}>
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="search-input-wrapper" style={{ marginBottom: '16px' }}>
                <img src={searchIcon} alt="search" className="icon-img" style={{ width: '14px', height: '14px' }} />
                <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {searching ? (
                <div className="modal-searching-loader">
                  <div className="spinner"></div>
                  <span>Searching users...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <p className="no-results-text">No users found matching your query.</p>
              ) : (
                <div className="users-search-results-list">
                  {searchResults.map((usr) => {
                    const initials = usr.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                    return (
                      <button
                        key={usr.email}
                        type="button"
                        className="user-search-item"
                        onClick={() => handleStartDM(usr.email)}
                      >
                        <div className="avatar-wrapper">
                          {usr.photo ? (
                            <img src={usr.photo} alt={usr.name} className="avatar-img" />
                          ) : (
                            <div className="avatar-initials-circle">{initials}</div>
                          )}
                          <span className="online-status-dot online"></span>
                        </div>
                        <div className="user-details-text">
                          <span className="user-name">{usr.name}</span>
                          <span className="user-sub">{usr.email} &bull; <strong style={{ textTransform: 'capitalize' }}>{usr.role}</strong></span>
                        </div>
                        <span className="action-tag">Message &rarr;</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
