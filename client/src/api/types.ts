export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface OnboardingProgress {
  id: string;
  userId: string;
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  documents: {
    id: string;
    type: string;
    status: 'pending' | 'uploaded' | 'verified' | 'rejected';
    filename?: string;
  }[];
  lastUpdated: string;
}
