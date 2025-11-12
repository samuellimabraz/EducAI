import React, { useState } from 'react';
import { X, Plus, Minus, RefreshCw } from 'lucide-react';
import './FractionVisualizer.css';

const FractionVisualizer = ({ onClose }) => {
  const [numerator1, setNumerator1] = useState(1);
  const [denominator1, setDenominator1] = useState(2);
  const [numerator2, setNumerator2] = useState(1);
  const [denominator2, setDenominator2] = useState(4);
  const [operation, setOperation] = useState('add');
  const [visualType, setVisualType] = useState('pizza');

  const simplifyFraction = (num, denom) => {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(Math.abs(num), Math.abs(denom));
    return {
      numerator: num / divisor,
      denominator: denom / divisor
    };
  };

  const calculateResult = () => {
    let resultNum, resultDenom;
    
    switch (operation) {
      case 'add':
        resultNum = numerator1 * denominator2 + numerator2 * denominator1;
        resultDenom = denominator1 * denominator2;
        break;
      case 'subtract':
        resultNum = numerator1 * denominator2 - numerator2 * denominator1;
        resultDenom = denominator1 * denominator2;
        break;
      case 'multiply':
        resultNum = numerator1 * numerator2;
        resultDenom = denominator1 * denominator2;
        break;
      case 'divide':
        resultNum = numerator1 * denominator2;
        resultDenom = denominator1 * numerator2;
        break;
      default:
        resultNum = 0;
        resultDenom = 1;
    }
    
    return simplifyFraction(resultNum, resultDenom);
  };

  const PizzaVisual = ({ numerator, denominator }) => {
    const slices = [];
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    for (let i = 0; i < denominator; i++) {
      const startAngle = (i * 360) / denominator - 90;
      const endAngle = ((i + 1) * 360) / denominator - 90;
      const filled = i < numerator;
      
      const x1 = centerX + radius * Math.cos(startAngle * Math.PI / 180);
      const y1 = centerY + radius * Math.sin(startAngle * Math.PI / 180);
      const x2 = centerX + radius * Math.cos(endAngle * Math.PI / 180);
      const y2 = centerY + radius * Math.sin(endAngle * Math.PI / 180);
      
      const largeArcFlag = 360 / denominator > 180 ? 1 : 0;
      const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      slices.push(
        <path
          key={i}
          d={path}
          fill={filled ? '#ff6b6b' : '#f8f9fa'}
          stroke="#333"
          strokeWidth="2"
        />
      );
    }
    
    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#333" strokeWidth="2" />
        {slices}
      </svg>
    );
  };

  const BarVisual = ({ numerator, denominator }) => {
    const bars = [];
    const barWidth = 180 / denominator;
    
    for (let i = 0; i < denominator; i++) {
      bars.push(
        <rect
          key={i}
          x={10 + i * barWidth}
          y={50}
          width={barWidth - 2}
          height={100}
          fill={i < numerator ? '#4ecdc4' : '#f8f9fa'}
          stroke="#333"
          strokeWidth="2"
        />
      );
    }
    
    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        {bars}
      </svg>
    );
  };

  const CircleSetVisual = ({ numerator, denominator }) => {
    const circles = [];
    const cols = Math.ceil(Math.sqrt(denominator));
    const rows = Math.ceil(denominator / cols);
    const circleRadius = Math.min(90 / cols, 90 / rows);
    
    for (let i = 0; i < denominator; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 20 + col * (circleRadius * 2 + 5) + circleRadius;
      const y = 20 + row * (circleRadius * 2 + 5) + circleRadius;
      
      circles.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={circleRadius - 2}
          fill={i < numerator ? '#9b59b6' : '#f8f9fa'}
          stroke="#333"
          strokeWidth="2"
        />
      );
    }
    
    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        {circles}
      </svg>
    );
  };

  const Visual = visualType === 'pizza' ? PizzaVisual : 
                  visualType === 'bar' ? BarVisual : CircleSetVisual;
  
  const result = calculateResult();

  return (
    <div className="fraction-visualizer">
      <div className="fraction-header">
        <h3>🍕 Fraction Visualizer</h3>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="fraction-content">
        <div className="visual-type-selector">
          <button 
            className={visualType === 'pizza' ? 'active' : ''}
            onClick={() => setVisualType('pizza')}
          >
            Pizza
          </button>
          <button 
            className={visualType === 'bar' ? 'active' : ''}
            onClick={() => setVisualType('bar')}
          >
            Bars
          </button>
          <button 
            className={visualType === 'circles' ? 'active' : ''}
            onClick={() => setVisualType('circles')}
          >
            Circles
          </button>
        </div>

        <div className="fractions-display">
          <div className="fraction-box">
            <div className="fraction-inputs">
              <input
                type="number"
                min="0"
                max="12"
                value={numerator1}
                onChange={(e) => setNumerator1(Math.max(0, Math.min(12, parseInt(e.target.value) || 0)))}
                className="fraction-number"
              />
              <div className="fraction-line"></div>
              <input
                type="number"
                min="1"
                max="12"
                value={denominator1}
                onChange={(e) => setDenominator1(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                className="fraction-number"
              />
            </div>
            <Visual numerator={numerator1} denominator={denominator1} />
            <p className="fraction-label">{numerator1}/{denominator1}</p>
          </div>

          <div className="operation-selector">
            <button 
              className={operation === 'add' ? 'active' : ''}
              onClick={() => setOperation('add')}
            >
              <Plus size={24} />
            </button>
            <button 
              className={operation === 'subtract' ? 'active' : ''}
              onClick={() => setOperation('subtract')}
            >
              <Minus size={24} />
            </button>
            <button 
              className={operation === 'multiply' ? 'active' : ''}
              onClick={() => setOperation('multiply')}
            >
              ×
            </button>
            <button 
              className={operation === 'divide' ? 'active' : ''}
              onClick={() => setOperation('divide')}
            >
              ÷
            </button>
          </div>

          <div className="fraction-box">
            <div className="fraction-inputs">
              <input
                type="number"
                min="0"
                max="12"
                value={numerator2}
                onChange={(e) => setNumerator2(Math.max(0, Math.min(12, parseInt(e.target.value) || 0)))}
                className="fraction-number"
              />
              <div className="fraction-line"></div>
              <input
                type="number"
                min="1"
                max="12"
                value={denominator2}
                onChange={(e) => setDenominator2(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                className="fraction-number"
              />
            </div>
            <Visual numerator={numerator2} denominator={denominator2} />
            <p className="fraction-label">{numerator2}/{denominator2}</p>
          </div>

          <div className="equals-sign">=</div>

          <div className="fraction-box result">
            <div className="fraction-display">
              <div className="fraction-number-display">{result.numerator}</div>
              <div className="fraction-line"></div>
              <div className="fraction-number-display">{result.denominator}</div>
            </div>
            <Visual numerator={result.numerator} denominator={result.denominator} />
            <p className="fraction-label result-label">
              {result.numerator}/{result.denominator}
              {result.numerator / result.denominator !== 
                (numerator1 * denominator2 + numerator2 * denominator1) / (denominator1 * denominator2) &&
                operation === 'add' && (
                  <span className="simplified"> (simplified)</span>
                )
              }
            </p>
          </div>
        </div>

        <div className="fraction-explanation">
          <h4>How it works:</h4>
          {operation === 'add' && (
            <p>
              To add fractions: {numerator1}/{denominator1} + {numerator2}/{denominator2}<br/>
              = ({numerator1} × {denominator2} + {numerator2} × {denominator1}) / ({denominator1} × {denominator2})<br/>
              = {numerator1 * denominator2 + numerator2 * denominator1}/{denominator1 * denominator2}
              {result.numerator !== numerator1 * denominator2 + numerator2 * denominator1 && 
                ` = ${result.numerator}/${result.denominator} (simplified)`
              }
            </p>
          )}
          {operation === 'subtract' && (
            <p>
              To subtract fractions: {numerator1}/{denominator1} - {numerator2}/{denominator2}<br/>
              = ({numerator1} × {denominator2} - {numerator2} × {denominator1}) / ({denominator1} × {denominator2})<br/>
              = {numerator1 * denominator2 - numerator2 * denominator1}/{denominator1 * denominator2}
              {result.numerator !== numerator1 * denominator2 - numerator2 * denominator1 && 
                ` = ${result.numerator}/${result.denominator} (simplified)`
              }
            </p>
          )}
          {operation === 'multiply' && (
            <p>
              To multiply fractions: {numerator1}/{denominator1} × {numerator2}/{denominator2}<br/>
              = ({numerator1} × {numerator2}) / ({denominator1} × {denominator2})<br/>
              = {numerator1 * numerator2}/{denominator1 * denominator2}
              {result.numerator !== numerator1 * numerator2 && 
                ` = ${result.numerator}/${result.denominator} (simplified)`
              }
            </p>
          )}
          {operation === 'divide' && (
            <p>
              To divide fractions: {numerator1}/{denominator1} ÷ {numerator2}/{denominator2}<br/>
              = {numerator1}/{denominator1} × {denominator2}/{numerator2}<br/>
              = ({numerator1} × {denominator2}) / ({denominator1} × {numerator2})<br/>
              = {numerator1 * denominator2}/{denominator1 * numerator2}
              {result.numerator !== numerator1 * denominator2 && 
                ` = ${result.numerator}/${result.denominator} (simplified)`
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FractionVisualizer;
