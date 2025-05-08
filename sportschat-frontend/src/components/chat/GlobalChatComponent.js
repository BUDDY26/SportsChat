import React, { useRef } from "react";
import { useChat } from "../../hooks/useChat";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import UserPresence from "./UserPresence";

const GlobalChat = ({ user }) => {
  const chatContainerRef = useRef(null);
  const { 
    messages, 
    loading, 
    error, 
    typingUsers, 
    isConnected, 
    sendMessage,
    setUserTyping
  } = useChat("globalChat", user);

  // Auto-scroll logic
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) return <div className="loading">Loading chat...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="global-chat-container">
      <div className="chat-header">
        <h2>Global Chat</h2>
        <UserPresence room="globalChat" />
      </div>
      
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">No messages yet. Start the conversation!</div>
        ) : (
          messages.map(msg => (
            <ChatMessage 
              key={msg.id}
              message={msg}
              isOwnMessage={msg.userId === user.id}
            />
          ))
        )}
        <TypingIndicator users={typingUsers} />
      </div>
      
      <ChatInput 
        onSendMessage={sendMessage} 
        onTyping={setUserTyping}
        disabled={!isConnected}
      />
    </div>
  );
};

export default GlobalChat;