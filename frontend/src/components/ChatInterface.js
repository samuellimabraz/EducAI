import React, { useState, useRef, useEffect } from 'react';
import { Send, Image } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import './ChatInterface.css';

const ChatInterface = ({ messages, onSendMessage, loading, pendingImage, onClearPendingImage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-attach pending image from SketchPad
    if (pendingImage) {
      setSelectedImage(pendingImage);
      if (onClearPendingImage) {
        onClearPendingImage();
      }
    }
  }, [pendingImage, onClearPendingImage]);

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
    // Pre-process content to handle both block and inline math
    let processedContent = message.content;

    // Convert \( ... \) to $ ... $ for inline math
    processedContent = processedContent.replace(/\\\(([^)]+)\\\)/g, (match, p1) => `$${p1}$`);

    // Convert \[ ... \] to $$ ... $$ for display math
    processedContent = processedContent.replace(/\\\[([^\]]+)\\\]/g, (match, p1) => `$$${p1}$$`);

    // Custom renderer for math content
    const components = {
      p: ({ children }) => {
        // Handle array of children
        if (Array.isArray(children)) {
          return (
            <p>
              {children.map((child, idx) => {
                if (typeof child === 'string') {
                  return renderTextWithMath(child, idx);
                }
                return child;
              })}
            </p>
          );
        }

        const text = String(children);
        return <p>{renderTextWithMath(text, 0)}</p>;
      },
      li: ({ children }) => {
        // Also handle math in list items
        if (Array.isArray(children)) {
          return (
            <li>
              {children.map((child, idx) => {
                if (typeof child === 'string') {
                  return renderTextWithMath(child, idx);
                }
                return child;
              })}
            </li>
          );
        }

        const text = String(children);
        return <li>{renderTextWithMath(text, 0)}</li>;
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
        {processedContent}
      </ReactMarkdown>
    );
  };

  const renderTextWithMath = (text, baseIndex) => {
    // Handle both inline ($...$) and display math ($$...$$)
    const parts = [];
    let lastIndex = 0;

    // First, handle display math ($$...$$)
    const displayMathPattern = /\$\$(.+?)\$\$/gs;
    const inlineMathPattern = /\$(.+?)\$/g;

    // Split for display math first
    let tempText = text;
    let displayMatches = [...tempText.matchAll(displayMathPattern)];

    if (displayMatches.length > 0) {
      displayMatches.forEach((match, idx) => {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          // Process inline math in the text before display math
          parts.push(...processInlineMath(beforeText, `${baseIndex}-d${idx}-`));
        }
        parts.push(
          <div key={`${baseIndex}-block-${idx}`} style={{ margin: '1em 0' }}>
            <BlockMath math={match[1]} />
          </div>
        );
        lastIndex = match.index + match[0].length;
      });

      // Process remaining text after last display math
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(...processInlineMath(remainingText, `${baseIndex}-dr-`));
      }

      return parts;
    }

    // If no display math, just process inline math
    return processInlineMath(text, `${baseIndex}-`);
  };

  const processInlineMath = (text, keyPrefix) => {
    const mathPattern = /\$(.+?)\$/g;
    const parts = [];
    let lastIndex = 0;
    let matches = [...text.matchAll(mathPattern)];

    if (matches.length === 0) {
      return text;
    }

    matches.forEach((match, index) => {
      // Add text before math
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push(<span key={`${keyPrefix}t${index}`}>{beforeText}</span>);
      }

      // Add math
      parts.push(<InlineMath key={`${keyPrefix}m${index}`} math={match[1]} />);
      lastIndex = match.index + match[0].length;
    });

    // Add remaining text
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(<span key={`${keyPrefix}tr`}>{remainingText}</span>);
    }

    return parts;
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
              {message.status && (
                <div className="message-status">
                  <div className="status-indicator"></div>
                  {message.status}
                </div>
              )}
              {message.content && (
                <div className="message-text">
                  {renderMessage(message)}
                  {message.streaming && <span className="streaming-cursor">▊</span>}
                </div>
              )}
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
                {new Date(message.timestamp).toLocaleTimeString('en-US', {
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
