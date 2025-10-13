import React from 'react';
import { useOnboardingProgress } from '../hooks/useOnboarding';
import { useDocuments } from '../hooks/useDocuments';

const OnboardingProgress: React.FC = () => {
  const { data: progress, isLoading: progressLoading, error: progressError } = useOnboardingProgress();
  const { data: documents, isLoading: documentsLoading } = useDocuments();

  if (progressLoading || documentsLoading) {
    return (
      <div className="bg-white border rounded p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (progressError) {
    return (
      <div className="bg-white border rounded p-4 shadow-sm">
        <div className="text-red-600">
          Failed to load onboarding progress: {progressError.message}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return 'bg-green-500';
      case 'in-progress':
      case 'uploaded':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Onboarding Progress</h2>
        
        {progress && (
          <>
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress.completedSteps.length} of {progress.totalSteps} steps</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(progress.completedSteps.length / progress.totalSteps) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Current Status</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(progress.status)}`}>
                  {progress.status.charAt(0).toUpperCase() + progress.status.slice(1).replace('-', ' ')}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Required Documents</h3>
                <ul className="space-y-2">
                  {progress.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 mr-3 rounded-full ${getStatusColor(doc.status)}`} />
                        <span>{doc.type}</span>
                        {doc.filename && (
                          <span className="ml-2 text-sm text-gray-500">({doc.filename})</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 capitalize">
                        {doc.status.replace('-', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {documents && documents.length > 0 && (
        <div className="bg-white border rounded p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{doc.originalName}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(doc.status)} text-white`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingProgress;
