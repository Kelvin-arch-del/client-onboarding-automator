import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '../api/onboarding';

export const useOnboardingProgress = () => {
  return useQuery({
    queryKey: ['onboarding', 'progress'],
    queryFn: onboardingApi.getProgress,
  });
};

export const useUpdateOnboardingStep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: any }) =>
      onboardingApi.updateStep(stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] });
    },
  });
};

export const useSubmitForReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: onboardingApi.submitForReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] });
    },
  });
};
