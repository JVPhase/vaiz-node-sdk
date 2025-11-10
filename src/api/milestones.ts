import { BaseAPIClient } from './base';
import {
  MilestonesResponse,
  CreateMilestoneRequest,
  CreateMilestoneResponse,
  GetMilestoneResponse,
  EditMilestoneRequest,
  EditMilestoneResponse,
  ToggleMilestoneRequest,
  ToggleMilestoneResponse,
  GetMilestoneHistoryRequest,
  GetMilestoneHistoryResponse,
} from '../models';

/**
 * Milestones API Client
 */
export class MilestonesAPIClient extends BaseAPIClient {
  /**
   * Get all milestones for a project
   */
  async getMilestones(projectId: string): Promise<MilestonesResponse> {
    const response = await this.makeRequest<MilestonesResponse>('getMilestones', 'POST', {
      projectId,
    });
    return response;
  }

  /**
   * Get a specific milestone by ID
   */
  async getMilestone(milestoneId: string): Promise<GetMilestoneResponse> {
    const response = await this.makeRequest<GetMilestoneResponse>('getMilestone', 'POST', {
      _id: milestoneId,
    });
    return response;
  }

  /**
   * Create a new milestone
   */
  async createMilestone(request: CreateMilestoneRequest): Promise<CreateMilestoneResponse> {
    const response = await this.makeRequest<CreateMilestoneResponse>(
      'createMilestone',
      'POST',
      request
    );
    return response;
  }

  /**
   * Edit an existing milestone
   */
  async editMilestone(request: EditMilestoneRequest): Promise<EditMilestoneResponse> {
    const { milestoneId, ...rest } = request;
    const response = await this.makeRequest<EditMilestoneResponse>('editMilestone', 'POST', {
      _id: milestoneId,
      ...rest,
    });
    return response;
  }

  /**
   * Toggle milestone completion status
   */
  async toggleMilestone(request: ToggleMilestoneRequest): Promise<ToggleMilestoneResponse> {
    const response = await this.makeRequest<ToggleMilestoneResponse>(
      'toggleMilestone',
      'POST',
      request
    );
    return response;
  }

  /**
   * Get history for a specific milestone
   */
  async getMilestoneHistory(
    request: GetMilestoneHistoryRequest
  ): Promise<GetMilestoneHistoryResponse> {
    const response = await this.makeRequest<GetMilestoneHistoryResponse>('getHistory', 'POST', {
      kind: 'Milestone',
      kindId: request.milestoneId,
      limit: request.limit,
      offset: request.offset,
    });
    return response;
  }
}
