import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import './ChatInterface.css';

const EXAMPLE_QUESTIONS = [
  {
    category: 'Calculus',
    icon: '∫',
    questions: [
      'Solve the integral of x²·sin(x) dx',
      'Find the derivative of ln(x²+1)',
      'Calculate the limit of (sin x)/x as x→0'
    ]
  },
  {
    category: 'Algebra',
    icon: 'x',
    questions: [
      'Solve the system: 2x + 3y = 7, x - y = 1',
      'Factor the polynomial x³ - 6x² + 11x - 6',
      'Find the roots of x² - 5x + 6 = 0'
    ]
  },
  {
    category: 'Linear Algebra',
    icon: '▦',
    questions: [
      'Find the eigenvalues of the matrix [[2,1],[1,2]]',
      'Calculate the determinant of a 3x3 matrix',
      'Is the set of vectors linearly independent?'
    ]
  },
  {
    category: 'Statistics',
    icon: 'σ',
    questions: [
      'Calculate the standard deviation of [2,4,4,4,5,5,7,9]',
      'Find the probability of getting exactly 3 heads in 5 coin flips',
      'Explain the Central Limit Theorem'
    ]
  },
  {
    category: 'Geometry',
    icon: '△',
    questions: [
      'Find the area of a triangle with vertices (0,0), (4,0), (2,3)',
      'Calculate the volume of a cone with radius 3 and height 5',
      'Prove that the angles of a triangle sum to 180°'
    ]
  },
  {
    category: 'Number Theory',
    icon: 'ℕ',
    questions: [
      'Find the GCD of 84 and 132',
      'Prove that √2 is irrational',
      'List all prime numbers less than 50'
    ]
  }
];

const ChatInterface = ({ messages, onSendMessage, loading, pendingImage, onClearPendingImage, pendingMessage, onClearPendingMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const isEmptyChat = messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant' && !messages[0].content.includes('?'));

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (pendingImage) {
      setSelectedImage(pendingImage);
      if (onClearPendingImage) {
        onClearPendingImage();
      }
    }
  }, [pendingImage, onClearPendingImage]);

  useEffect(() => {
    if (pendingMessage) {
      setInputMessage(pendingMessage);
      if (onClearPendingMessage) {
        onClearPendingMessage();
      }
    }
  }, [pendingMessage, onClearPendingMessage]);

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

  const handleExampleClick = (question) => {
    setInputMessage(question);
  };

  const renderMessage = (message) => {
    let processedContent = message.content;
    processedContent = processedContent.replace(/\\\(([^)]+)\\\)/g, (_, p1) => `$${p1}$`);
    processedContent = processedContent.replace(/\\\[([^\]]+)\\\]/g, (_, p1) => `$$${p1}$$`);

    const components = {
      p: ({ children }) => {
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
        return <p>{renderTextWithMath(String(children), 0)}</p>;
      },
      li: ({ children }) => {
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
        return <li>{renderTextWithMath(String(children), 0)}</li>;
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
    const parts = [];
    let lastIndex = 0;
    const displayMathPattern = /\$\$(.+?)\$\$/gs;
    const displayMatches = [...text.matchAll(displayMathPattern)];

    if (displayMatches.length > 0) {
      displayMatches.forEach((match, idx) => {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(...processInlineMath(beforeText, `${baseIndex}-d${idx}-`));
        }
        parts.push(
          <div key={`${baseIndex}-block-${idx}`} className="math-block">
            <BlockMath math={match[1]} />
          </div>
        );
        lastIndex = match.index + match[0].length;
      });

      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(...processInlineMath(remainingText, `${baseIndex}-dr-`));
      }
      return parts;
    }

    return processInlineMath(text, `${baseIndex}-`);
  };

  const processInlineMath = (text, keyPrefix) => {
    const mathPattern = /\$(.+?)\$/g;
    const parts = [];
    let lastIndex = 0;
    const matches = [...text.matchAll(mathPattern)];

    if (matches.length === 0) {
      return text;
    }

    matches.forEach((match, index) => {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push(<span key={`${keyPrefix}t${index}`}>{beforeText}</span>);
      }
      parts.push(<InlineMath key={`${keyPrefix}m${index}`} math={match[1]} />);
      lastIndex = match.index + match[0].length;
    });

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(<span key={`${keyPrefix}tr`}>{remainingText}</span>);
    }

    return parts;
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {isEmptyChat ? (
          <div className="welcome-screen">
            <div className="welcome-header">
              <img src="/logo.png" alt="EducAI" className="welcome-logo" />
              <h1>EducAI</h1>
              <p>Professional mathematics assistant</p>
            </div>
            
            <div className="examples-grid">
              {EXAMPLE_QUESTIONS.map((category) => (
                <div key={category.category} className="example-category">
                  <div className="category-header">
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.category}</span>
                  </div>
                  <div className="category-questions">
                    {category.questions.map((question, idx) => (
                      <button
                        key={idx}
                        className="example-question"
                        onClick={() => handleExampleClick(question)}
                      >
                        <Sparkles size={14} />
                        <span>{question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role} ${message.isError ? 'error' : ''}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? (
                    <div className="user-avatar">U</div>
                  ) : (
                    <img src="/logo.png" alt="EducAI" className="assistant-avatar" />
                  )}
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
                      <div className="status-indicator" />
                      {message.status}
                    </div>
                  )}
                  {message.content && (
                    <div className="message-text">
                      {renderMessage(message)}
                      {message.streaming && <span className="streaming-cursor">▊</span>}
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

            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="message assistant">
                <div className="message-avatar">
                  <img src="/logo.png" alt="EducAI" className="assistant-avatar" />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </>
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
            title="Attach image"
          >
            <Image size={20} />
          </button>

          <input
            type="text"
            className="message-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask any math question..."
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
