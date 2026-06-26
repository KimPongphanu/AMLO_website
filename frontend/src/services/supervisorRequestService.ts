// src/services/supervisorRequestService.ts
import { api } from '../utils/api'

export interface SupervisorRequest {
  id: number
  actionType: 'BAN' | 'DELETE' | 'FORCE_RESET'
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  requesterId: number
  targetId: number
  requester?: {
    uuid: string
    email: string
    firstname: string
    lastname: string
  }
  target?: {
    uuid: string
    email: string
    firstname: string
    lastname: string
  }
  createdAt: string
  respondedAt?: string
  expiresAt: string
}

interface CreateRequestPayload {
  targetUuid: string
  actionType: 'BAN' | 'DELETE' | 'FORCE_RESET'
  reason: string
  password: string
}

interface ActionPayload {
  otpToken?: string
}

export const supervisorRequestService = {
  /**
   * Create a new supervisor request (requires password)
   */
  create: async (payload: CreateRequestPayload) => {
    return await api<{
      success: boolean
      message: string
      data: { id: number }
    }>('/supervisor-request', {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    })
  },

  /**
   * Get pending requests targeting the current user
   */
  getPending: async () => {
    return await api<{ success: boolean; data: SupervisorRequest[] }>(
      '/supervisor-request/pending',
      { method: 'GET' },
    )
  },

  /**
   * Get requests sent by the current user
   */
  getSent: async () => {
    return await api<{ success: boolean; data: SupervisorRequest[] }>(
      '/supervisor-request/sent',
      { method: 'GET' },
    )
  },

  /**
   * Approve a request (requires OTP)
   */
  approve: async (id: number, payload: ActionPayload) => {
    return await api<{ success: boolean; message: string }>(
      `/supervisor-request/${id}/approve`,
      { method: 'POST', body: payload as unknown as Record<string, unknown> },
    )
  },

  /**
   * Reject a request
   */
  reject: async (id: number) => {
    return await api<{ success: boolean; message: string }>(
      `/supervisor-request/${id}/reject`,
      { method: 'POST' },
    )
  },
}
