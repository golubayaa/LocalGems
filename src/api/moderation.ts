import { apiClient } from "./client";

interface ModerationDecisionPayload {
  comment?: string;
}

export const moderationApi = {
  listQueue: async (page = 1, size = 20): Promise<unknown> => {
    const response = await apiClient.get<unknown>("/moderation/queue", {
      params: { page, size },
    });
    return response.data;
  },

  approveSuggestion: async (id: string, comment?: string): Promise<void> => {
    await apiClient.post(`/moderation/suggestions/${id}/approve`, { comment } satisfies ModerationDecisionPayload);
  },

  rejectSuggestion: async (id: string, comment?: string): Promise<void> => {
    await apiClient.post(`/moderation/suggestions/${id}/reject`, { comment } satisfies ModerationDecisionPayload);
  },

  revisionSuggestion: async (id: string, comment?: string): Promise<void> => {
    await apiClient.post(`/moderation/suggestions/${id}/revision`, { comment } satisfies ModerationDecisionPayload);
  },

  approveUpdate: async (id: string, comment?: string): Promise<void> => {
    await apiClient.post(`/moderation/updates/${id}/approve`, { comment } satisfies ModerationDecisionPayload);
  },

  rejectUpdate: async (id: string, comment?: string): Promise<void> => {
    await apiClient.post(`/moderation/updates/${id}/reject`, { comment } satisfies ModerationDecisionPayload);
  },
};
