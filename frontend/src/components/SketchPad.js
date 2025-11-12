import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Pencil, Download, Trash2 } from 'lucide-react';
import './SketchPad.css';

const SketchPad = ({ onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState('pencil'); // 'pencil' or 'eraser'

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.strokeStyle = tool === 'eraser' ? 'white' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    
    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
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

        <button className="tool-btn" onClick={clearCanvas} title="Clear">
          <Trash2 size={18} />
        </button>

        <button className="tool-btn" onClick={downloadDrawing} title="Download">
          <Download size={18} />
        </button>
      </div>

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

      <div className="sketch-footer">
        <button className="save-sketch-btn" onClick={saveDrawing}>
          Send to Chat
        </button>
      </div>
    </div>
  );
};

export default SketchPad;

