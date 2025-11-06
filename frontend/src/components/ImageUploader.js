import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image } from 'lucide-react';
import './ImageUploader.css';

const ImageUploader = ({ onImageSelect }) => {
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0 && onImageSelect) {
      onImageSelect(acceptedFiles[0]);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={`image-uploader ${isDragActive ? 'drag-active' : ''}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <div className="uploader-content">
          <Image size={48} />
          <p>Solte a imagem aqui...</p>
        </div>
      ) : (
        <div className="uploader-content">
          <Upload size={48} />
          <p>Arraste uma imagem ou clique para selecionar</p>
          <span className="upload-hint">JPG, PNG ou GIF - Máx. 10MB</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
