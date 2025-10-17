export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
}

export interface OnboardingProgress {
  id: string;
  userId: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedSteps: string[];
  totalSteps: number;
  currentStep: string;
  requiredDocuments: DocumentRequirement[];
  uploadedDocuments: DocumentUploadResponse[];
}

export interface DocumentRequirement {
  id: string;
  type: string;
  required: boolean;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  filename?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}
