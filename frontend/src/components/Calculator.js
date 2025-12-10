import React, { useState } from 'react';
import { X, MessageSquare, History, Delete } from 'lucide-react';
import { evaluate, pi, e } from 'mathjs';
import './Calculator.css';

const Calculator = ({ onClose, onSendToChat }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isRadians, setIsRadians] = useState(true);
  const [memory, setMemory] = useState(0);

  const appendToDisplay = (value) => {
    if (display === '0' && value !== '.') {
      setDisplay(value);
    } else if (display === 'Error') {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  const appendFunction = (func) => {
    if (display === '0' || display === 'Error') {
      setDisplay(func + '(');
    } else {
      setDisplay(display + func + '(');
    }
  };

  const calculateResult = () => {
    try {
      let expr = display;
      
      // Convert degree to radians for trig functions if needed
      if (!isRadians) {
        expr = expr.replace(/sin\(/g, 'sin((pi/180)*');
        expr = expr.replace(/cos\(/g, 'cos((pi/180)*');
        expr = expr.replace(/tan\(/g, 'tan((pi/180)*');
      }
      
      const result = evaluate(expr);
      const resultStr = typeof result === 'number' 
        ? (Number.isInteger(result) ? result.toString() : result.toPrecision(10).replace(/\.?0+$/, ''))
        : result.toString();
      
      const historyEntry = { expression: display, result: resultStr };
      setHistory(prev => [historyEntry, ...prev.slice(0, 19)]);
      setExpression(display + ' =');
      setDisplay(resultStr);
    } catch (error) {
      setDisplay('Error');
      setExpression('');
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
  };

  const clearAll = () => {
    setDisplay('0');
    setExpression('');
    setHistory([]);
  };

  const backspace = () => {
    if (display.length === 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const insertConstant = (constant) => {
    const value = constant === 'pi' ? pi.toString() : e.toString();
    if (display === '0' || display === 'Error') {
      setDisplay(value);
    } else {
      setDisplay(display + '*' + value);
    }
  };

  const factorial = () => {
    try {
      const num = parseFloat(display);
      if (num < 0 || !Number.isInteger(num)) {
        setDisplay('Error');
        return;
      }
      let result = 1;
      for (let i = 2; i <= num; i++) {
        result *= i;
      }
      setExpression(display + '! =');
      setDisplay(result.toString());
    } catch {
      setDisplay('Error');
    }
  };

  const memoryAdd = () => {
    try {
      const value = evaluate(display);
      setMemory(memory + value);
    } catch {}
  };

  const memorySubtract = () => {
    try {
      const value = evaluate(display);
      setMemory(memory - value);
    } catch {}
  };

  const memoryRecall = () => {
    setDisplay(memory.toString());
  };

  const memoryClear = () => {
    setMemory(0);
  };

  const handleSendToChat = () => {
    if (onSendToChat && display !== '0' && display !== 'Error') {
      const message = expression 
        ? `Calculate and explain: ${expression} ${display}`
        : `Explain the calculation: ${display}`;
      onSendToChat(message);
      onClose();
    }
  };

  const selectHistoryItem = (item) => {
    setDisplay(item.result);
    setExpression(item.expression + ' =');
    setShowHistory(false);
  };

  const Button = ({ onClick, children, className = '', span = 1, title }) => (
    <button 
      className={`calc-button ${className}`}
      onClick={onClick}
      style={span > 1 ? { gridColumn: `span ${span}` } : {}}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="calculator scientific">
      <div className="calculator-header">
        <h3>Scientific Calculator</h3>
        <div className="header-actions">
          <button 
            className={`header-btn ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="History"
          >
            <History size={18} />
          </button>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="calculator-history">
          <h4>History</h4>
          {history.length === 0 ? (
            <p className="no-history">No calculations yet</p>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <div 
                  key={index} 
                  className="history-item"
                  onClick={() => selectHistoryItem(item)}
                >
                  <span className="history-expr">{item.expression}</span>
                  <span className="history-result">= {item.result}</span>
                </div>
              ))}
            </div>
          )}
          <button className="clear-history" onClick={() => setHistory([])}>
            Clear History
          </button>
        </div>
      ) : (
        <>
          <div className="calculator-display-section">
            <div className="calculator-expression">{expression || '\u00A0'}</div>
            <div className="calculator-display">{display}</div>
            <div className="calculator-mode">
              <button 
                className={`mode-btn ${isRadians ? 'active' : ''}`}
                onClick={() => setIsRadians(true)}
              >
                RAD
              </button>
              <button 
                className={`mode-btn ${!isRadians ? 'active' : ''}`}
                onClick={() => setIsRadians(false)}
              >
                DEG
              </button>
              {memory !== 0 && <span className="memory-indicator">M</span>}
            </div>
          </div>

          <div className="calculator-buttons scientific-layout">
            {/* Row 1: Memory and special functions */}
            <Button onClick={memoryClear} className="function small" title="Memory Clear">MC</Button>
            <Button onClick={memoryRecall} className="function small" title="Memory Recall">MR</Button>
            <Button onClick={memoryAdd} className="function small" title="Memory Add">M+</Button>
            <Button onClick={memorySubtract} className="function small" title="Memory Subtract">M-</Button>
            <Button onClick={backspace} className="function" title="Backspace"><Delete size={18} /></Button>
            <Button onClick={clearAll} className="function" title="Clear All">AC</Button>

            {/* Row 2: Scientific functions */}
            <Button onClick={() => appendFunction('sin')} className="function small">sin</Button>
            <Button onClick={() => appendFunction('cos')} className="function small">cos</Button>
            <Button onClick={() => appendFunction('tan')} className="function small">tan</Button>
            <Button onClick={() => appendFunction('log10')} className="function small" title="Log base 10">log</Button>
            <Button onClick={() => appendFunction('log')} className="function small" title="Natural log">ln</Button>
            <Button onClick={() => appendToDisplay('^')} className="function" title="Power">x^y</Button>

            {/* Row 3: Inverse trig and more */}
            <Button onClick={() => appendFunction('asin')} className="function small" title="Inverse sine">sin⁻¹</Button>
            <Button onClick={() => appendFunction('acos')} className="function small" title="Inverse cosine">cos⁻¹</Button>
            <Button onClick={() => appendFunction('atan')} className="function small" title="Inverse tangent">tan⁻¹</Button>
            <Button onClick={() => appendFunction('sqrt')} className="function small">√</Button>
            <Button onClick={() => appendToDisplay('^(1/')} className="function small" title="nth root">ⁿ√</Button>
            <Button onClick={factorial} className="function small">n!</Button>

            {/* Row 4: Constants and parentheses */}
            <Button onClick={() => insertConstant('pi')} className="function small">π</Button>
            <Button onClick={() => insertConstant('e')} className="function small">e</Button>
            <Button onClick={() => appendToDisplay('(')} className="function">(</Button>
            <Button onClick={() => appendToDisplay(')')} className="function">)</Button>
            <Button onClick={() => appendToDisplay('%')} className="function">%</Button>
            <Button onClick={() => appendToDisplay('/')} className="operator">÷</Button>

            {/* Row 5-8: Number pad and operators */}
            <Button onClick={() => appendToDisplay('7')}>7</Button>
            <Button onClick={() => appendToDisplay('8')}>8</Button>
            <Button onClick={() => appendToDisplay('9')}>9</Button>
            <Button onClick={clear} className="function" span={2}>C</Button>
            <Button onClick={() => appendToDisplay('*')} className="operator">×</Button>

            <Button onClick={() => appendToDisplay('4')}>4</Button>
            <Button onClick={() => appendToDisplay('5')}>5</Button>
            <Button onClick={() => appendToDisplay('6')}>6</Button>
            <Button onClick={() => appendFunction('abs')} className="function small" span={2}>|x|</Button>
            <Button onClick={() => appendToDisplay('-')} className="operator">−</Button>

            <Button onClick={() => appendToDisplay('1')}>1</Button>
            <Button onClick={() => appendToDisplay('2')}>2</Button>
            <Button onClick={() => appendToDisplay('3')}>3</Button>
            <Button onClick={() => appendFunction('exp')} className="function small" span={2} title="e^x">eˣ</Button>
            <Button onClick={() => appendToDisplay('+')} className="operator">+</Button>

            <Button onClick={() => appendToDisplay('0')} span={2}>0</Button>
            <Button onClick={() => appendToDisplay('.')}>.</Button>
            <Button onClick={handleSendToChat} className="function chat-btn" span={2} title="Ask about this calculation">
              <MessageSquare size={16} />
              Ask
            </Button>
            <Button onClick={calculateResult} className="equals">=</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Calculator;
