import { BaseAPIClient } from './base';
import {
  GetSpaceMembersResponse,
  GetMemberHistoryRequest,
  GetMemberHistoryResponse,
} from '../models';

/**
 * Members API Client
 */
export class MembersAPIClient extends BaseAPIClient {
  /**
   * Get all members in the current space
   */
  async getSpaceMembers(): Promise<GetSpaceMembersResponse> {
    const response = await this.makeRequest<GetSpaceMembersResponse>('getSpaceMembers', 'POST', {});
    return response;
  }

  /**
   * Get history for a specific member
   */
  async getMemberHistory(request: GetMemberHistoryRequest): Promise<GetMemberHistoryResponse> {
    const response = await this.makeRequest<GetMemberHistoryResponse>('getHistory', 'POST', {
      kind: 'Member',
      kindId: request.memberId,
      limit: request.limit,
      offset: request.offset,
    });
    return response;
  }
}
