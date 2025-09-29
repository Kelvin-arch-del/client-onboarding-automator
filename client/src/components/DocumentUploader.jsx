import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DocumentUploader() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState([]);

  const onDrop = useCallback(acceptedFiles => {
    setErrors([]);
    setSuccess([]);
    const validFiles = [];
    const newErrors = [];
    acceptedFiles.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.push(`${file.name}: Invalid file type. Only PDF and DOCX allowed.`);
      } else {
        validFiles.push(file);
      }
    });
    setFiles(validFiles);
    setErrors(newErrors);
    if (validFiles.length > 0) {
      handleUpload(validFiles);
    }
  }, []);

  const handleUpload = async (filesToUpload) => {
    setUploading(true);
    setProgress({});
    const uploadPromises = filesToUpload.map(file => {
      return new Promise((resolve, reject) => {
        // Simulate upload with timeout and progress
        let percent = 0;
        const interval = setInterval(() => {
          percent += Math.random() * 20;
          setProgress(prev => ({ ...prev, [file.name]: Math.min(percent, 100) }));
          if (percent >= 100) {
            clearInterval(interval);
            // Simulate random error
            if (Math.random() < 0.1) {
              reject(`${file.name}: Upload failed. Please try again.`);
            } else {
              resolve(file);
            }
          }
        }, 300);
      });
    });
    try {
      const uploaded = await Promise.allSettled(uploadPromises);
      const successFiles = uploaded.filter(r => r.status === 'fulfilled').map(r => r.value);
      const errorFiles = uploaded.filter(r => r.status === 'rejected').map(r => r.reason);
      setSuccess(successFiles.map(f => `${f.name} uploaded successfully!`));
      setErrors(errorFiles);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isFocused, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true,
    maxFiles: 10,
    disabled: uploading,
    noKeyboard: false
  });

  return (
    <section aria-label="Document uploader" className="w-full max-w-lg mx-auto mt-8">
      <div
        {...getRootProps({
          className: `border-2 border-dashed rounded p-8 text-center cursor-pointer transition bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 ${isDragActive ? 'border-navy-900 bg-navy-50' : 'border-gray-300'} ${isFocused ? 'ring-2 ring-navy-900' : ''}`,
          tabIndex: 0,
          role: 'button',
          'aria-disabled': uploading
        })}
        aria-label="File drop area"
      >
        <input {...getInputProps()} aria-label="File input" />
        <p className="text-gray-700">Drag & drop PDF or DOCX files here, or click to select files</p>
        <p className="text-xs text-gray-400 mt-2">Accepted: PDF, DOCX. Max 10 files.</p>
      </div>
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-navy-900 font-semibold mb-2">Selected Files</h3>
          <ul className="divide-y divide-gray-100">
            {files.map(file => (
              <li key={file.name} className="py-2 flex items-center justify-between">
                <span className="truncate" title={file.name}>{file.name}</span>
                <span className="ml-2 text-xs text-gray-500">{formatBytes(file.size)}</span>
                <span className="ml-2 text-xs text-gray-500">{file.type}</span>
                {uploading && (
                  <div className="w-32 ml-4">
                    <div className="h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-navy-900 rounded"
                        style={{ width: `${progress[file.name] || 0}%` }}
                        aria-valuenow={progress[file.name] || 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        role="progressbar"
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {errors.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded" role="alert" aria-live="assertive">
          <ul className="list-disc pl-5">
            {errors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
        </div>
      )}
      {success.length > 0 && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded" role="status" aria-live="polite">
          <ul className="list-disc pl-5">
            {success.map((msg, idx) => <li key={idx}>{msg}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
