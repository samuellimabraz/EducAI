import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';
import './GraphVisualizer.css';

const GraphVisualizer = ({ data, onGenerateGraph, onClose }) => {
  const [functionInput, setFunctionInput] = useState('x^2');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);

  const generateData = (func) => {
    const points = [];
    const step = (xMax - xMin) / 100;
    
    for (let x = xMin; x <= xMax; x += step) {
      try {
        // Simple function evaluation (in production, use math.js or similar)
        const y = eval(func.replace(/x/g, `(${x})`).replace(/\^/g, '**'));
        if (!isNaN(y) && isFinite(y)) {
          points.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
        }
      } catch (e) {
        // Skip invalid points
      }
    }
    return points;
  };

  const handleGenerate = () => {
    if (onGenerateGraph) {
      onGenerateGraph(functionInput);
    }
  };

  const graphData = data || generateData(functionInput);

  return (
    <div className="graph-visualizer">
      <div className="graph-header">
        <h3>Visualizador de Gráficos</h3>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="graph-controls">
        <input
          type="text"
          placeholder="Digite a função (ex: x^2, 2*x+1)"
          value={functionInput}
          onChange={(e) => setFunctionInput(e.target.value)}
          className="function-input"
        />
        <div className="range-controls">
          <label>
            X min:
            <input
              type="number"
              value={xMin}
              onChange={(e) => setXMin(parseFloat(e.target.value))}
              className="range-input"
            />
          </label>
          <label>
            X max:
            <input
              type="number"
              value={xMax}
              onChange={(e) => setXMax(parseFloat(e.target.value))}
              className="range-input"
            />
          </label>
        </div>
        <button onClick={handleGenerate} className="generate-button">
          Gerar Gráfico
        </button>
      </div>
      
      <div className="graph-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#667eea" 
              strokeWidth={2}
              dot={false}
              name={`f(x) = ${functionInput}`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraphVisualizer;
