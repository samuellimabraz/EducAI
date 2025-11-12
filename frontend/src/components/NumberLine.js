import React, { useState } from 'react';
import { X, Plus, Minus, RotateCcw } from 'lucide-react';
import './NumberLine.css';

const NumberLine = ({ onClose }) => {
  const [minValue, setMinValue] = useState(-10);
  const [maxValue, setMaxValue] = useState(10);
  const [points, setPoints] = useState([0, 3, -5]);
  const [newPoint, setNewPoint] = useState('');
  const [operations, setOperations] = useState([]);
  const [showFractions, setShowFractions] = useState(false);
  const [showDecimals, setShowDecimals] = useState(false);
  
  const addPoint = () => {
    if (newPoint === '') return;
    const value = parseFloat(newPoint);
    if (!isNaN(value) && value >= minValue && value <= maxValue) {
      setPoints([...points, value]);
      setNewPoint('');
    }
  };
  
  const removePoint = (index) => {
    setPoints(points.filter((_, i) => i !== index));
  };
  
  const addOperation = (type, value) => {
    const newOp = {
      type,
      value: parseFloat(value),
      id: Date.now()
    };
    setOperations([...operations, newOp]);
    
    // Apply operation to all points
    setPoints(points.map(p => {
      if (type === 'add') return p + newOp.value;
      if (type === 'subtract') return p - newOp.value;
      if (type === 'multiply') return p * newOp.value;
      if (type === 'divide' && newOp.value !== 0) return p / newOp.value;
      return p;
    }));
  };
  
  const reset = () => {
    setPoints([0]);
    setOperations([]);
  };
  
  const NumberLineSVG = () => {
    const width = 700;
    const height = 200;
    const padding = 50;
    const lineY = height / 2;
    const range = maxValue - minValue;
    const scale = (width - 2 * padding) / range;
    
    // Calculate tick marks
    const tickInterval = range <= 20 ? 1 : range <= 50 ? 5 : 10;
    const ticks = [];
    for (let i = Math.ceil(minValue / tickInterval) * tickInterval; i <= maxValue; i += tickInterval) {
      ticks.push(i);
    }
    
    // Helper function to get x position for a value
    const getX = (value) => padding + (value - minValue) * scale;
    
    return (
      <svg width={width} height={height} className="number-line-svg">
        {/* Main line */}
        <line
          x1={padding}
          y1={lineY}
          x2={width - padding}
          y2={lineY}
          stroke="#333"
          strokeWidth="3"
        />
        
        {/* Arrows */}
        <polygon
          points={`${padding - 10},${lineY} ${padding},${lineY - 5} ${padding},${lineY + 5}`}
          fill="#333"
        />
        <polygon
          points={`${width - padding + 10},${lineY} ${width - padding},${lineY - 5} ${width - padding},${lineY + 5}`}
          fill="#333"
        />
        
        {/* Tick marks and labels */}
        {ticks.map(tick => {
          const x = getX(tick);
          return (
            <g key={tick}>
              <line
                x1={x}
                y1={lineY - 10}
                x2={x}
                y2={lineY + 10}
                stroke="#333"
                strokeWidth={tick === 0 ? "3" : "2"}
              />
              <text
                x={x}
                y={lineY + 30}
                textAnchor="middle"
                fontSize="14"
                fontFamily="Comic Sans MS, cursive"
                fill="#333"
              >
                {tick}
              </text>
            </g>
          );
        })}
        
        {/* Fraction marks */}
        {showFractions && range <= 20 && (
          <>
            {ticks.map(tick => {
              if (tick < maxValue) {
                const halfX = getX(tick + 0.5);
                return (
                  <g key={`${tick}-half`}>
                    <line
                      x1={halfX}
                      y1={lineY - 5}
                      x2={halfX}
                      y2={lineY + 5}
                      stroke="#999"
                      strokeWidth="1"
                    />
                    <text
                      x={halfX}
                      y={lineY + 45}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="Comic Sans MS, cursive"
                      fill="#999"
                    >
                      ½
                    </text>
                  </g>
                );
              }
              return null;
            })}
          </>
        )}
        
        {/* Points */}
        {points.map((point, index) => {
          const x = getX(point);
          if (x >= padding && x <= width - padding) {
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={lineY}
                  r="8"
                  fill={`hsl(${index * 60}, 70%, 50%)`}
                  stroke="#333"
                  strokeWidth="2"
                  className="number-point"
                  onClick={() => removePoint(index)}
                  style={{ cursor: 'pointer' }}
                />
                <text
                  x={x}
                  y={lineY - 15}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill={`hsl(${index * 60}, 70%, 40%)`}
                  fontFamily="Comic Sans MS, cursive"
                >
                  {showDecimals ? point.toFixed(1) : Math.round(point)}
                </text>
              </g>
            );
          }
          return null;
        })}
        
        {/* Operations visualization */}
        {operations.length > 0 && points.length > 0 && (
          <g>
            {operations.map((op, idx) => {
              const startX = getX(points[0] - operations.slice(0, idx + 1).reduce((acc, o) => {
                if (o.type === 'add') return acc + o.value;
                if (o.type === 'subtract') return acc - o.value;
                return acc;
              }, 0));
              const endX = getX(points[0] - operations.slice(0, idx).reduce((acc, o) => {
                if (o.type === 'add') return acc + o.value;
                if (o.type === 'subtract') return acc - o.value;
                return acc;
              }, 0));
              
              return (
                <g key={op.id}>
                  <path
                    d={`M ${startX} ${lineY - 20} Q ${(startX + endX) / 2} ${lineY - 40} ${endX} ${lineY - 20}`}
                    fill="none"
                    stroke={op.type === 'add' ? '#4caf50' : '#f44336'}
                    strokeWidth="2"
                    markerEnd={`url(#arrow-${op.type})`}
                  />
                  <text
                    x={(startX + endX) / 2}
                    y={lineY - 45}
                    textAnchor="middle"
                    fontSize="12"
                    fill={op.type === 'add' ? '#4caf50' : '#f44336'}
                    fontFamily="Comic Sans MS, cursive"
                  >
                    {op.type === 'add' ? '+' : '-'}{Math.abs(op.value)}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        
        {/* Arrow markers */}
        <defs>
          <marker
            id="arrow-add"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#4caf50" />
          </marker>
          <marker
            id="arrow-subtract"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#f44336" />
          </marker>
        </defs>
      </svg>
    );
  };
  
  return (
    <div className="number-line">
      <div className="number-line-header">
        <h3>📏 Number Line</h3>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="number-line-content">
        <div className="number-line-controls">
          <div className="range-controls">
            <label>
              Min:
              <input
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(parseInt(e.target.value) || -10)}
                className="range-input"
              />
            </label>
            <label>
              Max:
              <input
                type="number"
                value={maxValue}
                onChange={(e) => setMaxValue(parseInt(e.target.value) || 10)}
                className="range-input"
              />
            </label>
            <button onClick={reset} className="reset-button">
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
          
          <div className="point-controls">
            <input
              type="number"
              value={newPoint}
              onChange={(e) => setNewPoint(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPoint()}
              placeholder="Add point"
              className="point-input"
              step="0.1"
            />
            <button onClick={addPoint} className="add-point-button">
              Add Point
            </button>
          </div>
          
          <div className="operation-controls">
            <button 
              onClick={() => {
                const value = prompt('Add how much?');
                if (value && !isNaN(parseFloat(value))) {
                  addOperation('add', value);
                }
              }}
              className="operation-button add"
            >
              <Plus size={16} /> Add
            </button>
            <button 
              onClick={() => {
                const value = prompt('Subtract how much?');
                if (value && !isNaN(parseFloat(value))) {
                  addOperation('subtract', value);
                }
              }}
              className="operation-button subtract"
            >
              <Minus size={16} /> Subtract
            </button>
          </div>
          
          <div className="display-options">
            <label>
              <input
                type="checkbox"
                checked={showFractions}
                onChange={(e) => setShowFractions(e.target.checked)}
              />
              Show Fractions
            </label>
            <label>
              <input
                type="checkbox"
                checked={showDecimals}
                onChange={(e) => setShowDecimals(e.target.checked)}
              />
              Show Decimals
            </label>
          </div>
        </div>
        
        <div className="number-line-display">
          <NumberLineSVG />
        </div>
        
        <div className="points-list">
          <h4>Current Points:</h4>
          <div className="points-grid">
            {points.map((point, index) => (
              <div key={index} className="point-item">
                <span 
                  className="point-value"
                  style={{ color: `hsl(${index * 60}, 70%, 40%)` }}
                >
                  {showDecimals ? point.toFixed(1) : Math.round(point)}
                </span>
                <button
                  onClick={() => removePoint(index)}
                  className="remove-point"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {operations.length > 0 && (
          <div className="operations-history">
            <h4>Operations Applied:</h4>
            {operations.map(op => (
              <div key={op.id} className="operation-item">
                <span className={`operation-type ${op.type}`}>
                  {op.type === 'add' ? '+' : op.type === 'subtract' ? '-' : op.type === 'multiply' ? '×' : '÷'}
                  {op.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NumberLine;
