import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { X, Plus, Eye, EyeOff, MessageSquare, Download } from 'lucide-react';
import { evaluate } from 'mathjs';
import './GraphVisualizer.css';

const GraphVisualizer = ({ onClose, onSendToChat }) => {
  const [functions, setFunctions] = useState([
    { id: 1, expression: 'x^2', color: '#6366f1', visible: true }
  ]);
  const [newFunction, setNewFunction] = useState('');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  const [graphData, setGraphData] = useState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [evaluateX, setEvaluateX] = useState('');

  const colors = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4'];

  const functionTemplates = [
    { name: 'Linear', expr: 'x + 1' },
    { name: 'Quadratic', expr: 'x^2' },
    { name: 'Cubic', expr: 'x^3' },
    { name: 'Sine', expr: 'sin(x)' },
    { name: 'Cosine', expr: 'cos(x)' },
    { name: 'Tangent', expr: 'tan(x)' },
    { name: 'Absolute', expr: 'abs(x)' },
    { name: 'Square Root', expr: 'sqrt(x)' },
    { name: 'Exponential', expr: 'exp(x)' },
    { name: 'Logarithm', expr: 'log(x)' },
    { name: '1/x', expr: '1/x' },
  ];

  useEffect(() => {
    generateGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functions, xMin, xMax, yMin, yMax]);

  const evaluateFunction = (expression, xValue) => {
    try {
      const result = evaluate(expression, { x: xValue });
      return typeof result === 'number' ? result : NaN;
    } catch {
      return NaN;
    }
  };

  const generateData = () => {
    const points = [];
    const step = (xMax - xMin) / 300;

    for (let x = xMin; x <= xMax; x += step) {
      const point = { x: parseFloat(x.toFixed(4)) };

      functions.forEach((func) => {
        if (func.visible) {
          const y = evaluateFunction(func.expression, x);
          if (!isNaN(y) && isFinite(y) && y >= yMin && y <= yMax) {
            point[`f${func.id}`] = parseFloat(y.toFixed(4));
          }
        }
      });

      if (Object.keys(point).length > 1) {
        points.push(point);
      }
    }
    return points;
  };

  const generateGraph = () => {
    try {
      const data = generateData();
      setGraphData(data);
    } catch (error) {
      console.error('Error generating graph:', error);
    }
  };

  const addFunction = () => {
    if (!newFunction.trim()) return;

    const newId = Math.max(0, ...functions.map(f => f.id)) + 1;
    setFunctions([...functions, {
      id: newId,
      expression: newFunction,
      color: colors[functions.length % colors.length],
      visible: true
    }]);
    setNewFunction('');
  };

  const removeFunction = (id) => {
    if (functions.length > 1) {
      setFunctions(functions.filter(f => f.id !== id));
    }
  };

  const toggleFunction = (id) => {
    setFunctions(functions.map(f =>
      f.id === id ? { ...f, visible: !f.visible } : f
    ));
  };

  const updateFunction = (id, expression) => {
    setFunctions(functions.map(f =>
      f.id === id ? { ...f, expression } : f
    ));
  };

  const evaluatePoint = () => {
    if (!evaluateX) return;

    const x = parseFloat(evaluateX);
    const results = functions.filter(f => f.visible).map(f => ({
      expression: f.expression,
      value: evaluateFunction(f.expression, x),
      color: f.color
    }));

    setSelectedPoint({ x, results });
  };

  const askAboutFunction = (func) => {
    if (onSendToChat) {
      const message = `Analyze the function f(x) = ${func.expression}. Describe its properties, domain, range, and key features.`;
      onSendToChat(message);
      onClose();
    }
  };

  const askAboutAllFunctions = () => {
    if (onSendToChat && functions.length > 0) {
      const visibleFuncs = functions.filter(f => f.visible);
      if (visibleFuncs.length === 1) {
        askAboutFunction(visibleFuncs[0]);
      } else {
        const funcList = visibleFuncs.map((f, i) => `f${i+1}(x) = ${f.expression}`).join(', ');
        const message = `Compare and analyze these functions: ${funcList}. Describe their properties, intersections, and differences.`;
        onSendToChat(message);
        onClose();
      }
    }
  };

  const askAboutPoint = () => {
    if (onSendToChat && selectedPoint) {
      const results = selectedPoint.results.map(r => 
        `f(${selectedPoint.x}) = ${r.value.toFixed(4)} for f(x) = ${r.expression}`
      ).join('; ');
      const message = `Explain why at x = ${selectedPoint.x}: ${results}`;
      onSendToChat(message);
      onClose();
    }
  };

  const exportGraph = () => {
    const svg = document.querySelector('.graph-container svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = '#0f0f10';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = 'graph.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">x = {label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              y = {entry.value?.toFixed(4) || 'undefined'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="graph-visualizer">
      <div className="graph-header">
        <h3>Graph Visualizer</h3>
        <div className="header-actions">
          <button 
            className="header-btn" 
            onClick={exportGraph}
            title="Export as PNG"
          >
            <Download size={18} />
          </button>
          <button 
            className="header-btn" 
            onClick={askAboutAllFunctions}
            title="Ask about functions"
          >
            <MessageSquare size={18} />
          </button>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="graph-controls">
        <div className="function-list">
          <div className="section-header">
            <span>Functions</span>
          </div>
          {functions.map((func) => (
            <div key={func.id} className="function-item">
              <button
                className="visibility-toggle"
                onClick={() => toggleFunction(func.id)}
                style={{ color: func.visible ? func.color : 'var(--text-tertiary)' }}
              >
                {func.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <div 
                className="color-indicator" 
                style={{ backgroundColor: func.color }}
              />
              <input
                type="text"
                value={func.expression}
                onChange={(e) => updateFunction(func.id, e.target.value)}
                className="function-input"
                placeholder="e.g., x^2, sin(x)"
              />
              <button
                className="ask-btn"
                onClick={() => askAboutFunction(func)}
                title="Ask about this function"
              >
                <MessageSquare size={14} />
              </button>
              {functions.length > 1 && (
                <button
                  className="remove-function"
                  onClick={() => removeFunction(func.id)}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}

          {functions.length < colors.length && (
            <div className="add-function">
              <input
                type="text"
                placeholder="Add function (e.g., 2*x+1, x^3)"
                value={newFunction}
                onChange={(e) => setNewFunction(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFunction()}
                className="function-input"
              />
              <button onClick={addFunction} className="add-button">
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="templates-section">
          <div className="section-header">
            <span>Templates</span>
          </div>
          <div className="templates">
            {functionTemplates.map((template) => (
              <button
                key={template.name}
                className="template-button"
                onClick={() => setNewFunction(template.expr)}
                title={template.expr}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <div className="controls-row">
          <div className="range-controls">
            <div className="range-group">
              <label>X:</label>
              <input
                type="number"
                value={xMin}
                onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                className="range-input"
              />
              <span>to</span>
              <input
                type="number"
                value={xMax}
                onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                className="range-input"
              />
            </div>
            <div className="range-group">
              <label>Y:</label>
              <input
                type="number"
                value={yMin}
                onChange={(e) => setYMin(parseFloat(e.target.value) || -10)}
                className="range-input"
              />
              <span>to</span>
              <input
                type="number"
                value={yMax}
                onChange={(e) => setYMax(parseFloat(e.target.value) || 10)}
                className="range-input"
              />
            </div>
          </div>

          <div className="display-options">
            <label>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Grid
            </label>
            <label>
              <input
                type="checkbox"
                checked={showAxes}
                onChange={(e) => setShowAxes(e.target.checked)}
              />
              Axes
            </label>
          </div>
        </div>

        <div className="evaluate-section">
          <label>Evaluate at x =</label>
          <input
            type="number"
            value={evaluateX}
            onChange={(e) => setEvaluateX(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && evaluatePoint()}
            className="evaluate-input"
            step="0.1"
          />
          <button onClick={evaluatePoint} className="evaluate-button">
            Calculate
          </button>
        </div>

        {selectedPoint && (
          <div className="evaluation-results">
            <div className="results-header">
              <h4>At x = {selectedPoint.x}:</h4>
              <button 
                className="ask-result-btn"
                onClick={askAboutPoint}
                title="Ask about this point"
              >
                <MessageSquare size={14} />
                Ask
              </button>
            </div>
            {selectedPoint.results.map((result, index) => (
              <p key={index} style={{ borderLeft: `3px solid ${result.color}` }}>
                f(x) = {result.expression} → y = {
                  isNaN(result.value) ? 'undefined' : result.value.toFixed(4)
                }
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="graph-container">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={graphData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />}
            <XAxis
              dataKey="x"
              domain={[xMin, xMax]}
              type="number"
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              stroke="var(--border-color)"
              tickCount={10}
            />
            <YAxis
              domain={[yMin, yMax]}
              type="number"
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              stroke="var(--border-color)"
              tickCount={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
            />
            {showAxes && (
              <>
                <ReferenceLine x={0} stroke="var(--text-tertiary)" strokeWidth={1} />
                <ReferenceLine y={0} stroke="var(--text-tertiary)" strokeWidth={1} />
              </>
            )}
            {functions.map((func) => (
              func.visible && (
                <Line
                  key={func.id}
                  type="monotone"
                  dataKey={`f${func.id}`}
                  stroke={func.color}
                  strokeWidth={2}
                  dot={false}
                  name={`f(x) = ${func.expression}`}
                  connectNulls={false}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraphVisualizer;
