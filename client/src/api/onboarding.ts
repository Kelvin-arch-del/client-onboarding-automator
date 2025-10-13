import { apiClient } from './config';
import { ApiResponse, OnboardingProgress } from './types';

export const onboardingApi = {
  async getProgress(): Promise<OnboardingProgress> {
    try {
      const response = await apiClient.get<ApiResponse<OnboardingProgress>>(
        '/onboarding/progress'
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch onboarding progress');
    }
  },

  async updateStep(stepId: string, data: any): Promise<OnboardingProgress> {
    try {
      const response = await apiClient.patch<ApiResponse<OnboardingProgress>>(
        `/onboarding/steps/${stepId}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update onboarding step');
    }
  },

  async submitForReview(): Promise<OnboardingProgress> {
    try {
      const response = await apiClient.post<ApiResponse<OnboardingProgress>>(
        '/onboarding/submit'
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit for review');
    }
  },
};
