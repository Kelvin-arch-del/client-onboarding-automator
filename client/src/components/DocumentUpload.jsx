import React from 'react';
import { useDropzone } from 'react-dropzone';

export default function DocumentUpload() {
  const onDrop = acceptedFiles => {
    alert(`Files uploaded: ${acceptedFiles.map(f => f.name).join(', ')}`);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded p-8 text-center cursor-pointer transition bg-white mt-8 ${isDragActive ? 'border-navy-900 bg-navy-50' : 'border-gray-300'}`}>
      <input {...getInputProps()} />
      <p className="text-gray-700">Drag & drop documents here, or click to select files</p>
      <p className="text-xs text-gray-400 mt-2">Accepted: PDF, DOCX, JPG, PNG</p>
    </div>
  );
}
