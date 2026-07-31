import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import chatbotAvatar from '../assets/chatbot_avatar.png';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your Smart Hostel AI Assistant. Feel free to ask me any questions about room allocations, fee payments, logging complaints, outing gate passes, weekly mess menus, notices, or security settings. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Clear input if sending from text input
    if (!textToSend) {
      setInputValue('');
    }

    const newUserMessage = {
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:5000/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.reply || 'I processed your query but received an empty reply.',
          timestamp: new Date()
        }]);
      } else {
        const err = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `Sorry, I encountered an error communicating with the server: ${err.message || 'Server error'}. Please try again later.`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('[Chatbot] Fetch error:', error);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Sorry, I am unable to connect to the hostel server. Please check your internet connection.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  // Quick suggestion chips
  const suggestionChips = [
    "What is today's mess menu?",
    "Check my room details",
    "How to pay fees?",
    "How to register a complaint?",
    "What are the recent announcements?",
    "How to request a gate pass?"
  ];

  // Helper to parse double asterisks **bold** and line breaks \n
  const formatMessageText = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part.split('\n').map((line, lineIndex) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  return (
    <div className="chatbot-widget-container">
      {/* Floating chatbot window */}
      {isOpen && (
        <div className="chatbot-card animate-chatbot-popup">
          <div className="chatbot-header">
            <div className="chatbot-profile">
              <div className="chatbot-avatar-pulse">
                <img src={chatbotAvatar} alt="Smart Hostel AI Assistant" className="chatbot-avatar-img" />
              </div>
              <div>
                <h4>Hostel AI Assistant</h4>
                <div className="chatbot-online-indicator">
                  <span className="dot" />
                  <span>Online & Ready</span>
                </div>
              </div>
            </div>
            <button type="button" className="chatbot-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
              &times;
            </button>
          </div>

          <div className="chatbot-messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`chatbot-message-row ${msg.sender}`}>
                <div className="chatbot-message-bubble">
                  <p>{formatMessageText(msg.text)}</p>
                  <span className="chatbot-message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message-row bot">
                <div className="chatbot-message-bubble chatbot-typing-indicator">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div className="chatbot-suggestions-container">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="chatbot-suggestion-chip"
                onClick={() => handleSend(chip)}
                disabled={isLoading}
              >
                {chip}
              </button>
            ))}
          </div>

          <form onSubmit={handleFormSubmit} className="chatbot-input-form">
            <input
              type="text"
              placeholder="Ask me a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="chatbot-send-btn" disabled={!inputValue.trim() || isLoading} aria-label="Send query">
              <span className="chatbot-send-btn-text">➤</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Hostel AI Chatbot"
        aria-label="Toggle chatbot window"
      >
        {isOpen ? (
          <span className="chatbot-close-icon-text">×</span>
        ) : (
          <img src={chatbotAvatar} alt="Chat" className="chatbot-toggle-avatar" />
        )}
      </button>
    </div>
  );
}
