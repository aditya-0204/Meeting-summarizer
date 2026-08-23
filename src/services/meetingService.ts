import { request } from './api.js';
import { Meeting, WorkspaceStats, ActionItemStatus } from '../types/meeting.js';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const MeetingApiClient = {
  /**
   * Upload an audio file to initiate processing pipeline
   */
  async uploadAudio(file: File, title?: string): Promise<{ meetingId: string; meeting: Meeting }> {
    const formData = new FormData();
    formData.append('audio', file);
    if (title && title.trim()) {
      formData.append('title', title.trim());
    }

    const response = await request<ApiResponse<{ meetingId: string; meeting: Meeting }>>(
      '/api/meetings/upload',
      {
        method: 'POST',
        body: formData
      }
    );

    return response.data;
  },

  /**
   * Load a pre-configured sample meeting transcript
   */
  async loadSampleMeeting(sample: {
    title: string;
    originalFileName: string;
    transcript: string;
    durationSeconds?: number;
  }): Promise<{ meetingId: string; meeting: Meeting }> {
    const response = await request<ApiResponse<{ meetingId: string; meeting: Meeting }>>(
      '/api/meetings/sample',
      {
        method: 'POST',
        body: JSON.stringify(sample)
      }
    );

    return response.data;
  },

  /**
   * Fetch all meetings with status and metadata
   */
  async getAllMeetings(params?: {
    status?: string;
    search?: string;
  }): Promise<{ meetings: Meeting[]; total: number; stats: WorkspaceStats }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const url = `/api/meetings${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await request<
      ApiResponse<{ meetings: Meeting[]; total: number; stats: WorkspaceStats }>
    >(url, { method: 'GET' });

    return response.data;
  },

  /**
   * Fetch single meeting details with full transcript and summary
   */
  async getMeetingById(id: string): Promise<Meeting> {
    const response = await request<ApiResponse<{ meeting: Meeting }>>(`/api/meetings/${id}`, {
      method: 'GET'
    });
    return response.data.meeting;
  },

  /**
   * Update action item status or assigned owner
   */
  async updateActionItem(
    meetingId: string,
    actionItemId: string,
    status: ActionItemStatus,
    owner?: string | null
  ): Promise<Meeting> {
    const response = await request<ApiResponse<{ meeting: Meeting }>>(
      `/api/meetings/${meetingId}/action-items/${actionItemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, owner })
      }
    );
    return response.data.meeting;
  },

  /**
   * Delete meeting and storage
   */
  async deleteMeeting(id: string): Promise<void> {
    await request<ApiResponse<null>>(`/api/meetings/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Reprocess existing meeting
   */
  async reprocessMeeting(id: string): Promise<Meeting> {
    const response = await request<ApiResponse<{ meeting: Meeting }>>(
      `/api/meetings/${id}/reprocess`,
      { method: 'POST' }
    );
    return response.data.meeting;
  },

  /**
   * Get workspace analytics
   */
  async getMetrics(): Promise<WorkspaceStats> {
    const response = await request<ApiResponse<{ stats: WorkspaceStats }>>('/api/meetings/metrics', {
      method: 'GET'
    });
    return response.data.stats;
  }
};
