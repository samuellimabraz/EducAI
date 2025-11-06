import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import ChatInterface from './components/ChatInterface';
import Calculator from './components/Calculator';
import GraphVisualizer from './components/GraphVisualizer';
import ImageUploader from './components/ImageUploader';
import Sidebar from './components/Sidebar';
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
  const [sessionId] = useState(uuidv4());
  const [showCalculator, setShowCalculator] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [currentGraph, setCurrentGraph] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'Olá! 👋 Sou seu assistente de matemática! Como posso ajudar você hoje? Você pode me enviar problemas, fazer perguntas ou até enviar fotos de exercícios!',
        timestamp: new Date(),
      }
    ]);
  }, []);

  const sendMessage = async (content, image = null) => {
    if (!content.trim() && !image) {
      toast.error('Por favor, digite uma mensagem ou envie uma imagem');
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

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', content);
      formData.append('session_id', sessionId);
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/api/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add assistant response
      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.response,
        suggestions: response.data.suggestions,
        visualization: response.data.visualization,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Handle visualization if present
      if (response.data.visualization) {
        handleVisualization(response.data.visualization);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Desculpe, ocorreu um erro. Tente novamente!');
      
      // Add error message
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Ops! Parece que tive um problema. Você pode tentar novamente?',
        isError: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualization = (visualization) => {
    if (visualization.type === 'graph') {
      setCurrentGraph(visualization.data);
      setShowGraph(true);
    } else if (visualization.type === 'calculation') {
      setShowCalculator(true);
    }
  };

  const handleCalculatorResult = (result) => {
    const message = `Calculadora: ${result.expression} = ${result.result}`;
    sendMessage(message);
  };

  const handleGraphFunction = (functionStr) => {
    sendMessage(`Gerar gráfico da função: ${functionStr}`);
  };

  const clearChat = () => {
    setMessages([
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'Conversa limpa! Como posso ajudar você agora? 🎯',
        timestamp: new Date(),
      }
    ]);
    
    // Clear session on backend
    api.delete(`/api/history/${sessionId}`).catch(console.error);
  };

  return (
    <div className="App">
      <Toaster position="top-right" />
      
      <div className="app-container">
        <Sidebar
          onToggleCalculator={() => setShowCalculator(!showCalculator)}
          onToggleGraph={() => setShowGraph(!showGraph)}
          onClearChat={clearChat}
          showCalculator={showCalculator}
          showGraph={showGraph}
        />
        
        <main className="main-content">
          <header className="app-header">
            <h1>🧮 EduMath AI</h1>
            <p>Seu assistente inteligente de matemática</p>
          </header>
          
          <div className="content-area">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              loading={loading}
              suggestions={messages[messages.length - 1]?.suggestions}
            />
            
            <div className="tools-panel">
              {showCalculator && (
                <Calculator
                  onResult={handleCalculatorResult}
                  onClose={() => setShowCalculator(false)}
                />
              )}
              
              {showGraph && (
                <GraphVisualizer
                  data={currentGraph}
                  onGenerateGraph={handleGraphFunction}
                  onClose={() => setShowGraph(false)}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
