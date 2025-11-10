import { ColorInfo } from './base';
import { AvatarMode } from './enums';

/**
 * Member (space member)
 */
export interface Member {
  id: string;
  nickName?: string;
  fullName?: string;
  email: string;
  avatar?: string;
  avatarMode: AvatarMode;
  color: ColorInfo;
  space: string;
  status: string;
  joinedDate: string;
  updatedAt: string;
}

/**
 * Get space members response
 */
export interface GetSpaceMembersResponse {
  members: Member[];
}

/**
 * Get member history request
 */
export interface GetMemberHistoryRequest {
  memberId: string;
  limit?: number;
  offset?: number;
}

/**
 * Get member history response
 */
export interface GetMemberHistoryResponse {
  histories: Array<{
    id: string;
    kind: 'Member' | 'User';
    action: string;
    userId: string;
    createdAt: string;
    changes?: Record<string, any>;
  }>;
  total: number;
}
