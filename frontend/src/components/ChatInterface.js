import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import './ChatInterface.css';

const ChatInterface = ({ messages, onSendMessage, loading, suggestions }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() || selectedImage) {
      onSendMessage(inputMessage, selectedImage);
      setInputMessage('');
      setSelectedImage(null);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const renderMessage = (message) => {
    // Custom renderer for math content
    const components = {
      p: ({ children }) => {
        const text = String(children);
        // Check for inline math patterns
        const mathPattern = /\$([^\$]+)\$/g;
        const parts = text.split(mathPattern);
        
        if (parts.length > 1) {
          return (
            <p>
              {parts.map((part, index) => {
                if (index % 2 === 1) {
                  return <InlineMath key={index} math={part} />;
                }
                return part;
              })}
            </p>
          );
        }
        
        return <p>{children}</p>;
      },
      code: ({ inline, className, children }) => {
        const match = /language-(\w+)/.exec(className || '');
        const lang = match ? match[1] : '';
        
        if (lang === 'math' && !inline) {
          return <BlockMath math={String(children).replace(/\n$/, '')} />;
        }
        
        return (
          <code className={inline ? 'inline-code' : 'block-code'}>
            {children}
          </code>
        );
      }
    };

    return (
      <ReactMarkdown components={components}>
        {message.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {message.image && (
                <img 
                  src={message.image} 
                  alt="Uploaded" 
                  className="message-image"
                />
              )}
              <div className="message-text">
                {renderMessage(message)}
              </div>
              {message.suggestions && (
                <div className="suggestions">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-chip"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="quick-suggestions">
          <span className="suggestions-label">Sugestões:</span>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-button"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form className="input-form" onSubmit={handleSubmit}>
        {selectedImage && (
          <div className="selected-image-preview">
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Selected" 
            />
            <button
              type="button"
              className="remove-image"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        )}
        
        <div className="input-container">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          
          <button
            type="button"
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            title="Anexar imagem"
          >
            <Image size={20} />
          </button>
          
          <input
            type="text"
            className="message-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite sua pergunta de matemática..."
            disabled={loading}
          />
          
          <button
            type="submit"
            className="send-button"
            disabled={loading || (!inputMessage.trim() && !selectedImage)}
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
