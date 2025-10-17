import { apiClient } from './config';
import { ApiResponse, DocumentUploadResponse } from './types';

export const documentsApi = {
  async uploadDocument(file: File, documentType?: string): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      if (documentType) {
        formData.append('type', documentType);
      }

      const response = await apiClient.post<ApiResponse<DocumentUploadResponse>>(
        '/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            // You can emit progress events here if needed
            console.log(`Upload Progress: ${percentCompleted}%`);
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Document upload failed');
    }
  },

  async getDocuments(): Promise<DocumentUploadResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<DocumentUploadResponse[]>>('/documents');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch documents');
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await apiClient.delete(`/documents/${documentId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete document');
    }
  },
};
