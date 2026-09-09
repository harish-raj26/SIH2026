import apiClient from '../api/api';

export const approvalService = {
  async discoverApprovals(businessId) {
    const data = await apiClient.get(
      `/api/approvals/discover/${businessId}`
    );

    console.log('DISCOVERY RESPONSE:', data);
    console.log(
      'DISCOVERY APPROVAL COUNT:',
      data?.approvals?.length
    );
    console.log(
      'EXISTING APPROVAL COUNT:',
      data?.existing_approval_count
    );
    console.log(
      'NEW APPROVAL COUNT:',
      data?.new_approval_count
    );

    return data;
  },

  async getRoadmap(businessId) {
    return await apiClient.get(
      `/api/roadmap/${businessId}`
    );
  },
};