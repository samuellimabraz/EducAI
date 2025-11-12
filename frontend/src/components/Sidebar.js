import React from 'react';
import { Calculator, LineChart, Trash2, MessageSquare } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({
  onToggleCalculator,
  onToggleGraph,
  onClearChat,
  showCalculator,
  showGraph
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🧮 Ferramentas</h2>
      </div>

      <div className="sidebar-tools">
        <button
          className={`tool-button ${showCalculator ? 'active' : ''}`}
          onClick={onToggleCalculator}
          title="Calculadora"
        >
          <Calculator size={20} />
          <span>Calculadora</span>
        </button>

        <button
          className={`tool-button ${showGraph ? 'active' : ''}`}
          onClick={onToggleGraph}
          title="Gráficos"
        >
          <LineChart size={20} />
          <span>Gráficos</span>
        </button>

        <button
          className="tool-button"
          onClick={onClearChat}
          title="Limpar conversa"
        >
          <Trash2 size={20} />
          <span>Limpar Chat</span>
        </button>
      </div>

      <div className="sidebar-tips">
        <h3>💡 Dicas</h3>
        <ul>
          <li>Envie fotos de exercícios</li>
          <li>Pergunte passo a passo</li>
          <li>Use a calculadora para conferir</li>
          <li>Visualize funções no gráfico</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
