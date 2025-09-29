import React from 'react';
import ClientIntakeForm from './ClientIntakeForm';
import DocumentUpload from './DocumentUpload';

export default function ClientPortal() {
  return (
    <div className="min-h-screen bg-navy-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-navy-900 mb-6 text-center">Client Portal</h1>
        <ClientIntakeForm />
        <DocumentUpload />
      </div>
    </div>
  );
}
