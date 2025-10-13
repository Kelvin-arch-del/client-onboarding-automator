import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OnboardingProgress from './components/OnboardingProgress';
import Login from './components/Login';
import DocumentUpload from './components/DocumentUpload';
import { useAuth } from './auth/useAuth';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding-progress" element={<OnboardingProgress />} />
        <Route path="/upload" element={
          <div className="bg-white border rounded p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
            <DocumentUpload onUploadComplete={() => window.location.reload()} />
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
