import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import { DocumentUploadResponse } from '../api/types';

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getDocuments,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType?: string }) =>
      documentsApi.uploadDocument(file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] });
    },
  });
};
