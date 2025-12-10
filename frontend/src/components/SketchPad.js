import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Eraser, Pencil, Download, Trash2, Undo2 } from 'lucide-react';
import './SketchPad.css';

const SketchPad = ({ onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState('pencil');
  const [history, setHistory] = useState([]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL();
      setHistory(prev => [...prev, imageData]);
    }
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  }, [saveToHistory]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    saveToHistory();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(e);
    
    ctx.strokeStyle = tool === 'eraser' ? 'white' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const undo = () => {
    if (history.length <= 1) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const newHistory = history.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = previousState;
    
    setHistory(newHistory);
  };

  const clearCanvas = () => {
    saveToHistory();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (onSave && blob) {
        const file = new File([blob], 'sketch.png', { type: 'image/png' });
        onSave(file);
      }
    });
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'math-sketch.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="sketch-pad">
      <div className="sketch-header">
        <h3>Sketch Pad</h3>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="sketch-toolbar">
        <button
          className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
          onClick={() => setTool('pencil')}
          title="Pencil"
        >
          <Pencil size={18} />
        </button>
        
        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser"
        >
          <Eraser size={18} />
        </button>

        <div className="color-picker">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={tool === 'eraser'}
          />
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="width-slider"
          title="Line width"
        />

        <div className="toolbar-spacer"></div>

        <button 
          className="tool-btn" 
          onClick={undo} 
          title="Undo"
          disabled={history.length <= 1}
        >
          <Undo2 size={18} />
        </button>

        <button className="tool-btn" onClick={clearCanvas} title="Clear">
          <Trash2 size={18} />
        </button>

        <button className="tool-btn" onClick={downloadDrawing} title="Download">
          <Download size={18} />
        </button>
      </div>

      <div className="sketch-canvas-container">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="sketch-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      <div className="sketch-footer">
        <button className="save-sketch-btn" onClick={saveDrawing}>
          Send to Chat
        </button>
      </div>
    </div>
  );
};

export default SketchPad;
