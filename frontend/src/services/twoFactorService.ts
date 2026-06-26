// src/services/twoFactorService.ts
import { api } from '../utils/api'

export interface TwoFactorSetupResponse {
  success: boolean
  data: {
    secret: string
    otpauthUrl: string
    qrCodeDataUrl: string | null
  }
}

export interface Enable2FAResponse {
  success: boolean
  message: string
  data: {
    recoveryKeys: string[]
  }
}

export interface RecoveryKeysResponse {
  success: boolean
  data: {
    count: number
    available: boolean
  }
}

export interface RegenerateKeysResponse {
  success: boolean
  message: string
  data: {
    recoveryKeys: string[]
  }
}

export interface CheckEmailResponse {
  success?: boolean
  found: boolean
  role?: 'ADMIN' | 'SUPERVISOR' | 'USER'
  message?: string
}

export const twoFactorService = {
  setup2FA: async (): Promise<TwoFactorSetupResponse> => {
    return await api<TwoFactorSetupResponse>('/2fa/setup', {
      method: 'POST',
    })
  },

  enable2FA: async (otpToken: string): Promise<Enable2FAResponse> => {
    return await api<Enable2FAResponse>('/2fa/enable', {
      method: 'POST',
      body: { otpToken },
    })
  },

  disable2FA: async (payload: {
    recoveryKey?: string
    otpToken?: string
  }): Promise<{ success: boolean; message: string }> => {
    return await api<{ success: boolean; message: string }>('/2fa/disable', {
      method: 'POST',
      body: payload,
    })
  },

  getRecoveryKeys: async (): Promise<RecoveryKeysResponse> => {
    return await api<RecoveryKeysResponse>('/2fa/recovery-keys', {
      method: 'GET',
    })
  },

  regenerateRecoveryKeys: async (): Promise<RegenerateKeysResponse> => {
    return await api<RegenerateKeysResponse>('/2fa/recovery-keys/regenerate', {
      method: 'POST',
    })
  },

  requestEmailOTP: async (
    email: string,
  ): Promise<{ success: boolean; message: string }> => {
    return await api<{ success: boolean; message: string }>(
      '/2fa/otp/request',
      {
        method: 'POST',
        body: { email },
      },
    )
  },

  verifyEmailOTP: async (
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> => {
    return await api<{ success: boolean; message: string }>('/2fa/otp/verify', {
      method: 'POST',
      body: { email, otp },
    })
  },

  verify2FALogin: async (
    otpToken: string,
  ): Promise<{ success: boolean; message: string; user?: unknown }> => {
    return await api<{ success: boolean; message: string; user?: unknown }>(
      '/2fa/verify-login',
      {
        method: 'POST',
        body: { otpToken },
      },
    )
  },

  useRecoveryKey: async (
    email: string,
    recoveryKey: string,
  ): Promise<{
    success: boolean
    message: string
    data?: { resetToken: string }
  }> => {
    return await api<{
      success: boolean
      message: string
      data?: { resetToken: string }
    }>('/2fa/recovery/use', {
      method: 'POST',
      body: { email, recoveryKey },
    })
  },

  checkEmail: async (email: string): Promise<CheckEmailResponse> => {
    return await api<CheckEmailResponse>('/auth/check-email', {
      method: 'POST',
      body: { email },
    })
  },
}
