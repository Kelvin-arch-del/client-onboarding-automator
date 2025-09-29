import React, { useEffect, useMemo, useState } from 'react';

// ClientPortal.jsx
// Purpose: Client-facing portal with secure login, onboarding checklist with step indicators,
// drag-and-drop uploads per requirement, progress tracker, email notification stub,
// personalized dashboard for case status and messages, and responsive design.
// NOTE: This is a frontend-only implementation with placeholders. Integrate with backend APIs.

// TODO: Integrate with real auth API for client login (separate from admin auth)
// TODO: Replace mock data fetches with real endpoints
// TODO: Wire document upload to backend storage service (S3/GCS/local) with auth
// TODO: Hook emailNotification to serverless function or backend mailer
// TODO: Replace local state messages with real-time messaging (WebSocket/SSE)

const REQUIRED_DOCUMENTS = [
  { id: 'id-proof', title: 'Government ID', description: 'Driver’s license or passport (photo and address visible).' },
  { id: 'retainer', title: 'Signed Engagement/Retainer', description: 'Signed retainer agreement PDF.' },
  { id: 'financial', title: 'Financial Statement', description: 'Recent bank statement or pay stub.' },
  { id: 'intake', title: 'Completed Intake Form', description: 'Download, complete, and upload the intake form.' },
];

const STEPS = [
  { id: 'create-account', label: 'Create Client Account' },
  { id: 'verify-email', label: 'Verify Email' },
  { id: 'upload-docs', label: 'Upload Required Documents' },
  { id: 'review', label: 'Attorney Review' },
  { id: 'complete', label: 'Onboarding Complete' },
];

function calcProgress(stepIndex, uploadedMap) {
  const stepPortion = Math.min(stepIndex / (STEPS.length - 1), 1);
  const docPortion = REQUIRED_DOCUMENTS.length
    ? Object.values(uploadedMap).filter(Boolean).length / REQUIRED_DOCUMENTS.length
    : 0;
  return Math.round((stepPortion * 0.6 + docPortion * 0.4) * 100);
}

async function sendEmailNotification({ to, subject, body }) {
  // TODO: Replace with backend call: await fetch('/api/notify/email', { method: 'POST', ... })
  console.info('Email notification (stub):', { to, subject, body });
  return { ok: true };
}

function useClientAuth() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email, accessCode) => {
    setLoading(true);
    setError('');
    try {
      // TODO: Replace with real endpoint e.g., POST /api/client/auth/login
      await new Promise((r) => setTimeout(r, 600));
      if (!email || !accessCode) throw new Error('Missing credentials');
      const token = 'client.jwt.mock.token';
      setClient({ id: 'client_123', email, name: email.split('@')[0], token });
      await sendEmailNotification({
        to: email,
        subject: 'New sign-in to your Client Portal',
        body: 'If this was not you, contact support immediately.'
      });
    } catch (e) {
      setError(e.message || 'Login failed');
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => setClient(null);

  return { client, loading, error, login, logout };
}

function Dropzone({ label, onFilesSelected, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const inputId = React.useMemo(() => `file-${Math.random().toString(36).slice(2)}`, []);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files || []);
    onFilesSelected?.(files);
  };

  const handleSelect = (e) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected?.(files);
  };

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`block border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input id={inputId} type="file" multiple className="hidden" onChange={handleSelect} disabled={disabled} aria-label={`Upload files for ${label}`} />
      <p className="text-sm text-gray-600">Drag & drop files here, or click to select.</p>
      <p className="text-xs text-gray-400">{label}</p>
    </label>
  );
}

function DocumentRequirement({ doc, uploaded, onUpload, onRemove, disabled }) {
  const handleFiles = async (files) => {
    if (!files?.length) return;
    // TODO: Upload to backend storage with auth token
    const file = files[0];
    await new Promise((r) => setTimeout(r, 400));
    onUpload?.({ id: doc.id, name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() });
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-gray-900">{doc.title}</h4>
          <p className="text-sm text-gray-600">{doc.description}</p>
        </div>
        {uploaded ? (
          <span className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs">Uploaded</span>
        ) : (
          <span className="text-amber-700 bg-amber-100 px-2 py-1 rounded text-xs">Required</span>
        )}
      </div>
      {uploaded ? (
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div className="truncate">
            <span className="font-medium">{uploaded.name}</span>
            <span className="text-gray-400 ml-2">{Math.round(uploaded.size/1024)} KB</span>
          </div>
          <div className="flex gap-2">
            <button className="text-blue-600 hover:underline" onClick={() => window.alert('Preview stub. TODO: open viewer.')}>Preview</button>
            <button className="text-red-600 hover:underline" onClick={() => onRemove?.(doc.id)}>Remove</button>
          </div>
        </div>
      ) : (
        <Dropzone label={`Upload ${doc.title}`} onFilesSelected={handleFiles} disabled={disabled} />
      )}
    </div>
  );
}

function StepIndicator({ current }) {
  return (
    <ol className="flex flex-wrap items-center gap-3">
      {STEPS.map((s, idx) => {
        const complete = idx <= current;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span className={`h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold ${complete ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{idx + 1}</span>
            <span className={`text-sm ${complete ? 'text-blue-700' : 'text-gray-600'}`}>{s.label}</span>
            {idx < STEPS.length - 1 && <span className="w-6 h-px bg-gray-300 mx-1" />}
          </li>
        );
      })}
    </ol>
  );
}

function MessagesPanel({ messages }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Messages</h3>
      {messages.length === 0 ? (
        <p className="text-sm text-gray-600">No messages yet.</p>
      ) : (
        <ul className="divide-y">
          {messages.map((m) => (
            <li key={m.id} className="py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{m.from}</span>
                <span className="text-xs text-gray-400">{new Date(m.at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700">{m.text}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <button
          className="text-sm text-blue-700 hover:underline"
          onClick={() => window.alert('Open full messaging view (TODO: integrate real-time messaging).')}
        >
          View all messages
        </button>
      </div>
    </div>
  );
}

function CaseStatusCard({ status, lastUpdated, reference }) {
  const color = {
    Pending: 'bg-amber-50 text-amber-800 border-amber-200',
    Active: 'bg-blue-50 text-blue-800 border-blue-200',
    Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Needs Attention': 'bg-rose-50 text-rose-800 border-rose-200',
  }[status] || 'bg-gray-50 text-gray-800 border-gray-200';

  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <h3 className="text-lg font-semibold">Case Status: {status}</h3>
      <p className="text-sm">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
      <p className="text-xs mt-1">Reference: {reference}</p>
    </div>
  );
}

function ClientLogin({ loading, error, onLogin }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md bg-white border rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-yellow-500" aria-hidden />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Client Portal Login</h1>
            <p className="text-xs text-gray-600">This login is for clients. Staff should use the admin portal.</p>
          </div>
        </div>
        {error ? <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">{error}</div> : null}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Access Code</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              className="w-full border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="absolute right-2 top-2 text-sm text-gray-500" onClick={() => setShow((s) => !s)} type="button">
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500">Use the code provided by your attorney or emailed to you.</p>
        </div>
        <button
          disabled={loading}
          onClick={() => onLogin(email.trim(), code.trim())}
          className={`w-full py-2 rounded font-semibold ${loading ? 'bg-gray-300 text-gray-600' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="text-xs text-gray-500">
          By signing in, you agree to our terms and acknowledge our privacy policy.
        </div>
      </div>
    </div>
  );
}

export default function ClientPortal() {
  const { client, loading, error, login, logout } = useClientAuth();

  const [stepIndex, setStepIndex] = useState(2);
  const [uploads, setUploads] = useState({});
  const [messages] = useState([
    { id: 'm1', from: 'Paralegal Jane', text: 'Please upload your signed retainer.', at: Date.now() - 86400000 },
    { id: 'm2', from: 'Attorney Smith', text: 'We received your ID. Thank you.', at: Date.now() - 3600000 },
  ]);
  const [caseInfo] = useState({
    status: 'Pending',
    lastUpdated: Date.now() - 7200000,
    reference: 'CASE-2025-00123',
  });

  const progress = useMemo(() => calcProgress(stepIndex, uploads), [stepIndex, uploads]);

  const handleUpload = async (fileMeta) => {
    setUploads((prev) => ({ ...prev, [fileMeta.id]: fileMeta }));
    await sendEmailNotification({
      to: client?.email || 'client@example.com',
      subject: `Document uploaded: ${fileMeta.id}`,
      body: `Client uploaded ${fileMeta.name}.`
    });
  };

  const handleRemove = (docId) => {
    setUploads((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const completeDocs = Object.values(uploads).length === REQUIRED_DOCUMENTS.length;

  useEffect(() => {
    if (completeDocs && stepIndex < 3) {
      setStepIndex(3);
    }
  }, [completeDocs, stepIndex]);

  if (!client) {
    return <ClientLogin loading={loading} error={error} onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-yellow-500" aria-hidden />
            <div>
              <h1 className="text-xl font-semibold">Client Portal</h1>
              <p className="text-xs opacity-90">Welcome, {client.name}</p>
            </div>
          </div>
          <button className="text-sm bg-yellow-500 text-blue-900 font-semibold px-3 py-1 rounded" onClick={logout}>Sign out</button>
        </div>
      </header>

      <