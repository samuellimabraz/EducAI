import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import { Menu, Plus, Trash2, Calculator as CalcIcon, LineChart, Pencil, PieChart, Hash } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Calculator from './components/Calculator';
import GraphVisualizer from './components/GraphVisualizer';
import SketchPad from './components/SketchPad';
import FractionVisualizer from './components/FractionVisualizer';
import NumberLine from './components/NumberLine';
import './App.css';

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(uuidv4());
  const [sessions, setSessions] = useState([{ id: sessionId, name: 'New Chat', timestamp: new Date() }]);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  
  // Tool states
  const [showCalculator, setShowCalculator] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showSketch, setShowSketch] = useState(false);
  const [showFractions, setShowFractions] = useState(false);
  const [showNumberLine, setShowNumberLine] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);

  useEffect(() => {
    // Load chat history for the current session
    const loadHistory = async () => {
      try {
        const response = await api.get(`/api/history/${sessionId}`);
        const history = response.data.messages || [];
        
        if (history.length > 0) {
          // Convert backend format to frontend format
          const formattedMessages = history.map(msg => ({
            id: uuidv4(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            has_image: msg.has_image || false,
          }));
          setMessages(formattedMessages);
        } else {
          // No history, show welcome message
          setMessages([
            {
              id: uuidv4(),
              role: 'assistant',
              content: 'Hello! 👋 I\'m your math learning assistant! How can I help you today? You can ask questions, send me problems, or upload images of exercises!',
              timestamp: new Date(),
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading history:', error);
        // On error, show welcome message
        setMessages([
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Hello! 👋 I\'m your math learning assistant! How can I help you today? You can ask questions, send me problems, or upload images of exercises!',
            timestamp: new Date(),
          }
        ]);
      }
    };
    
    loadHistory();
  }, [sessionId]);

  const sendMessage = async (content, image = null) => {
    if (!content.trim() && !image) {
      toast.error('Please type a message or upload an image');
      return;
    }

    // Add user message to chat
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: content,
      image: image ? URL.createObjectURL(image) : null,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add placeholder for assistant message (streaming)
    const assistantId = uuidv4();
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };
    setMessages(prev => [...prev, assistantMessage]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', content);
      formData.append('session_id', sessionId);
      formData.append('stream', 'true');
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setLoading(false);
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantId 
                    ? { ...msg, streaming: false }
                    : msg
                )
              );
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'status') {
                // Update status in assistant message
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantId
                      ? { ...msg, status: parsed.message }
                      : msg
                  )
                );
              } else if (parsed.type === 'response') {
                // Append content
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantId
                      ? { ...msg, content: msg.content + parsed.content, status: null }
                      : msg
                  )
                );
              } else if (parsed.type === 'error') {
                toast.error(parsed.message);
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantId
                      ? { ...msg, content: parsed.message, isError: true, status: null }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Sorry, an error occurred. Please try again!');
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: 'Oops! I had a problem. Can you try again?', isError: true, status: null }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = () => {
    const newId = uuidv4();
    const newSession = {
      id: newId,
      name: `Chat ${sessions.length + 1}`,
      timestamp: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setSessionId(newId);
    setMessages([]);
  };

  const deleteSession = (id) => {
    if (sessions.length === 1) {
      toast.error('You must have at least one session');
      return;
    }
    
    setSessions(prev => prev.filter(s => s.id !== id));
    if (sessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      setSessionId(remaining[0].id);
    }
    
    // Clear session on backend
    api.delete(`/api/history/${id}`).catch(console.error);
  };

  return (
    <div className="App">
      <Toaster position="top-right" />
      
      <div className="app-container">
        {/* Collapsible Sidebar */}
        <div className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
          <div className="sidebar-toggle" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
            <Menu size={24} />
          </div>
          
          {sidebarExpanded && (
            <div className="sidebar-content">
              <button className="sidebar-btn" onClick={createNewSession}>
                <Plus size={18} />
                New Chat
              </button>
              
              <div className="sidebar-sessions">
                <h4 style={{ marginBottom: '12px', fontSize: '12px', opacity: 0.6 }}>
                  SESSIONS
                </h4>
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className={`session-item ${session.id === sessionId ? 'active' : ''}`}
                    onClick={() => setSessionId(session.id)}
                  >
                    <span>{session.name}</span>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <main className="main-content">
          <header className="app-header">
            <h1>EducAI</h1>
            <p>Your intelligent mathematics learning assistant</p>
          </header>
          
          <div className="tool-buttons">
            <button
              className={`tool-icon-btn ${showCalculator ? 'active' : ''}`}
              onClick={() => setShowCalculator(!showCalculator)}
              title="Calculator"
            >
              <CalcIcon size={18} />
            </button>
            
            <button
              className={`tool-icon-btn ${showGraph ? 'active' : ''}`}
              onClick={() => setShowGraph(!showGraph)}
              title="Graph"
            >
              <LineChart size={18} />
            </button>
            
            <button
              className={`tool-icon-btn ${showFractions ? 'active' : ''}`}
              onClick={() => setShowFractions(!showFractions)}
              title="Fractions"
            >
              <PieChart size={18} />
            </button>
            
            <button
              className={`tool-icon-btn ${showNumberLine ? 'active' : ''}`}
              onClick={() => setShowNumberLine(!showNumberLine)}
              title="Number Line"
            >
              <Hash size={18} />
            </button>
            
            <button
              className={`tool-icon-btn ${showSketch ? 'active' : ''}`}
              onClick={() => setShowSketch(!showSketch)}
              title="Sketch Pad"
            >
              <Pencil size={18} />
            </button>
          </div>
          
          <div className="content-area">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              loading={loading}
              pendingImage={pendingImage}
              onClearPendingImage={() => setPendingImage(null)}
                />
          </div>
        </main>
      </div>
      
      {/* Tool Modals */}
      {showCalculator && (
        <>
          <div className="modal-backdrop" onClick={() => setShowCalculator(false)} />
          <Calculator onClose={() => setShowCalculator(false)} />
        </>
      )}
      
      {showGraph && (
        <>
          <div className="modal-backdrop" onClick={() => setShowGraph(false)} />
          <GraphVisualizer onClose={() => setShowGraph(false)} />
        </>
      )}
      
      {showFractions && (
        <>
          <div className="modal-backdrop" onClick={() => setShowFractions(false)} />
          <FractionVisualizer onClose={() => setShowFractions(false)} />
        </>
      )}
      
      {showNumberLine && (
        <>
          <div className="modal-backdrop" onClick={() => setShowNumberLine(false)} />
          <NumberLine onClose={() => setShowNumberLine(false)} />
        </>
      )}
      
      {showSketch && (
        <>
          <div className="modal-backdrop" onClick={() => setShowSketch(false)} />
          <SketchPad
            onClose={() => setShowSketch(false)}
            onSave={(file) => {
              setPendingImage(file);
              setShowSketch(false);
              toast.success('Sketch attached! Type your message.');
            }}
          />
        </>
      )}
    </div>
  );
}

export default App;
