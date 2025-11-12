import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { X, Plus, Grid, Eye, EyeOff, Info } from 'lucide-react';
import './GraphVisualizer.css';

const GraphVisualizer = ({ onClose }) => {
  const [functions, setFunctions] = useState([
    { id: 1, expression: 'x^2', color: '#667eea', visible: true }
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

  const colors = ['#667eea', '#f56565', '#48bb78', '#ed8936', '#9f7aea', '#38b2ac'];

  const functionTemplates = [
    { name: 'Line', expr: 'x + 1' },
    { name: 'Parabola', expr: 'x^2' },
    { name: 'Cubic', expr: 'x^3' },
    { name: 'Sine', expr: 'sin(x)' },
    { name: 'Cosine', expr: 'cos(x)' },
    { name: 'Absolute', expr: 'abs(x)' },
    { name: 'Square Root', expr: 'sqrt(x)' },
  ];

  useEffect(() => {
    generateGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functions, xMin, xMax, yMin, yMax]);

  const preprocessFunction = (func) => {
    // Convert natural math notation to JavaScript
    let processed = func.toLowerCase().trim();

    // Replace math functions
    processed = processed.replace(/sin/g, 'Math.sin');
    processed = processed.replace(/cos/g, 'Math.cos');
    processed = processed.replace(/tan/g, 'Math.tan');
    processed = processed.replace(/sqrt/g, 'Math.sqrt');
    processed = processed.replace(/abs/g, 'Math.abs');
    processed = processed.replace(/log/g, 'Math.log');
    processed = processed.replace(/ln/g, 'Math.log');
    processed = processed.replace(/pi/g, 'Math.PI');
    processed = processed.replace(/e(?![a-z])/g, 'Math.E');

    // Add multiplication signs where needed (e.g., 2x -> 2*x)
    processed = processed.replace(/(\d)([a-z])/g, '$1*$2');
    processed = processed.replace(/([a-z])(\d)/g, '$1*$2');
    processed = processed.replace(/\)\(/g, ')*(');
    processed = processed.replace(/(\d)\(/g, '$1*(');
    processed = processed.replace(/\)([a-z])/g, ')*$1');
    processed = processed.replace(/([a-z])\(/g, (match, p1) => {
      // Don't add * after Math functions
      if (processed.indexOf('Math.' + p1) !== -1) return match;
      return p1 + '*(';
    });

    // Replace ^ with ** for exponentiation
    processed = processed.replace(/\^/g, '**');

    return processed;
  };

  const evaluateFunction = (func, x) => {
    try {
      const processed = preprocessFunction(func);
      // Create a safe evaluation context
      const mathContext = {
        x: x,
        Math: Math
      };
      // Use Function constructor for safer evaluation
      const evaluator = new Function('x', 'Math', `return ${processed}`);
      return evaluator(x, Math);
    } catch (e) {
      return NaN;
    }
  };

  const generateData = () => {
    const points = [];
    const step = (xMax - xMin) / 200; // More points for smoother curves

    for (let x = xMin; x <= xMax; x += step) {
      const point = { x: parseFloat(x.toFixed(3)) };

      functions.forEach((func, index) => {
        if (func.visible) {
          const y = evaluateFunction(func.expression, x);
          if (!isNaN(y) && isFinite(y) && y >= yMin && y <= yMax) {
            point[`f${func.id}`] = parseFloat(y.toFixed(3));
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

    const newId = Math.max(...functions.map(f => f.id)) + 1;
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
    const results = functions.map(f => ({
      expression: f.expression,
      value: evaluateFunction(f.expression, x)
    }));

    setSelectedPoint({ x, results });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`x = ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`y = ${entry.value?.toFixed(2) || 'undefined'}`}
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
        <h3>📊 Graph Visualizer</h3>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="graph-controls">
        <div className="function-list">
          {functions.map((func, index) => (
            <div key={func.id} className="function-item">
              <button
                className="visibility-toggle"
                onClick={() => toggleFunction(func.id)}
                style={{ color: func.color }}
              >
                {func.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <input
                type="text"
                value={func.expression}
                onChange={(e) => updateFunction(func.id, e.target.value)}
                className="function-input"
                style={{ borderColor: func.color }}
              />
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
                placeholder="Add function (e.g., 2x+1, x^3)"
                value={newFunction}
                onChange={(e) => setNewFunction(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFunction()}
                className="function-input"
              />
              <button onClick={addFunction} className="add-button">
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="templates-section">
          <p className="templates-label">Quick Templates:</p>
          <div className="templates">
            {functionTemplates.map((template) => (
              <button
                key={template.name}
                className="template-button"
                onClick={() => setNewFunction(template.expr)}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <div className="range-controls">
          <div className="range-group">
            <label>X Range:</label>
            <input
              type="number"
              value={xMin}
              onChange={(e) => setXMin(parseFloat(e.target.value))}
              className="range-input"
            />
            <span>to</span>
            <input
              type="number"
              value={xMax}
              onChange={(e) => setXMax(parseFloat(e.target.value))}
              className="range-input"
            />
          </div>
          <div className="range-group">
            <label>Y Range:</label>
            <input
              type="number"
              value={yMin}
              onChange={(e) => setYMin(parseFloat(e.target.value))}
              className="range-input"
            />
            <span>to</span>
            <input
              type="number"
              value={yMax}
              onChange={(e) => setYMax(parseFloat(e.target.value))}
              className="range-input"
            />
          </div>
        </div>

        <div className="evaluate-section">
          <label>Evaluate at x =</label>
          <input
            type="number"
            value={evaluateX}
            onChange={(e) => setEvaluateX(e.target.value)}
            className="evaluate-input"
          />
          <button onClick={evaluatePoint} className="evaluate-button">
            Calculate
          </button>
        </div>

        {selectedPoint && (
          <div className="evaluation-results">
            <h4>At x = {selectedPoint.x}:</h4>
            {selectedPoint.results.map((result, index) => (
              <p key={index}>
                f(x) = {result.expression} → y = {result.value.toFixed(3)}
              </p>
            ))}
          </div>
        )}

        <div className="display-options">
          <label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Show Grid
          </label>
          <label>
            <input
              type="checkbox"
              checked={showAxes}
              onChange={(e) => setShowAxes(e.target.checked)}
            />
            Show Axes
          </label>
        </div>
      </div>

      <div className="graph-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
            <XAxis
              dataKey="x"
              domain={[xMin, xMax]}
              type="number"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[yMin, yMax]}
              type="number"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {showAxes && (
              <>
                <ReferenceLine x={0} stroke="#666" strokeWidth={1} />
                <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
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
