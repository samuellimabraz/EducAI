import React, { useState } from 'react';
import { X } from 'lucide-react';
import './Calculator.css';

const Calculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setExpression(`${inputValue} ${nextOperation}`);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
      setExpression(`${newValue} ${nextOperation}`);
    } else {
      setExpression(`${inputValue} ${nextOperation}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      
      setExpression(`${previousValue} ${operation} ${inputValue} =`);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  return (
    <div className="calculator">
      <div className="calculator-header">
        <h3>Calculator</h3>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="calculator-expression">{expression || '\u00A0'}</div>
      <div className="calculator-display">{display}</div>
      <div className="calculator-buttons">
        <button className="calc-button function" onClick={clear}>C</button>
        <button className="calc-button function" onClick={() => inputOperation('/')}>÷</button>
        <button className="calc-button function" onClick={() => inputOperation('*')}>×</button>
        <button className="calc-button function" onClick={() => inputOperation('-')}>−</button>
        
        <button className="calc-button" onClick={() => inputNumber(7)}>7</button>
        <button className="calc-button" onClick={() => inputNumber(8)}>8</button>
        <button className="calc-button" onClick={() => inputNumber(9)}>9</button>
        <button className="calc-button function tall" onClick={() => inputOperation('+')}>+</button>
        
        <button className="calc-button" onClick={() => inputNumber(4)}>4</button>
        <button className="calc-button" onClick={() => inputNumber(5)}>5</button>
        <button className="calc-button" onClick={() => inputNumber(6)}>6</button>
        
        <button className="calc-button" onClick={() => inputNumber(1)}>1</button>
        <button className="calc-button" onClick={() => inputNumber(2)}>2</button>
        <button className="calc-button" onClick={() => inputNumber(3)}>3</button>
        <button className="calc-button function tall" onClick={performCalculation}>=</button>
        
        <button className="calc-button wide" onClick={() => inputNumber(0)}>0</button>
        <button className="calc-button" onClick={() => {
          if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
          }
        }}>.</button>
      </div>
    </div>
  );
};

export default Calculator;
