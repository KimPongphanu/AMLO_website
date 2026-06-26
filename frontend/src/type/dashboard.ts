// src/types/dashboard.ts
// ============================================
// Dashboard State Management Types
// ============================================

// ✅ Import DepartmentItem จาก department.ts (ไม่ใช่ content.ts)
import type { UserProfile } from './auth'
import type { CommentItem, ContactRequest, NewsItem } from './content'
import type { DepartmentItem } from './department'

/**
 * Dashboard menu identifiers
 */
export type DashboardMenuId =
  | 'overview'
  | 'data-clean'
  | 'settings'
  | 'reviews'
  | 'contacts'
  | 'advertises'
  | 'user-manage'
  | 'news'
  | 'departments'
  | 'slider'

/**
 * Contact requests group structure
 * Groups contact inquiries by email
 */
export interface ContactsGroup {
  data: ContactRequest[]
  loading: boolean
  total: number
  pending: number
  fetchAll: () => Promise<void>
  updateStatus: (id: string, currentStatus: string) => Promise<void>
}

/**
 * Main Dashboard store state
 */
export interface DashboardState {
  // Contact State
  contacts: ContactsGroup

  // PR State
  prs: NewsItem[]
  fetchPRs: () => Promise<void>
  createPR: (form: FormData) => Promise<void>
  updatePR: (id: number, form: FormData) => Promise<void>

  // News State
  newsList: NewsItem[]
  fetchNews: () => Promise<void>
  createNews: (form: FormData) => Promise<void>
  updateNews: (id: number, form: FormData) => Promise<void>

  // Department State - ✅ ใช้ DepartmentItem จาก department.ts
  departmentList: DepartmentItem[]
  departmentLoading: boolean
  fetchDepartments: () => Promise<void>
  setDepartmentList: (
    updater: DepartmentItem[] | ((prev: DepartmentItem[]) => DepartmentItem[]),
  ) => void
  createDepartment: (form: FormData) => Promise<boolean>
  updateDepartment: (id: number, form: FormData) => Promise<boolean>
  deleteDepartment: (id: number) => Promise<boolean>

  // Comment State
  commentList: CommentItem[]
  commentLoading: boolean
  fetchComments: () => Promise<void>
  setCommentList: (
    comments: CommentItem[] | ((prev: CommentItem[]) => CommentItem[]),
  ) => void
  toggleCommentShow: (id: string, currentShow: boolean) => Promise<void>
  bulkToggleCommentShow: (ids: string[], show: boolean) => Promise<void>
}

/**
 * Auth store state with role checking helpers
 */
export interface AuthState {
  user: UserProfile | null
  isLoggedIn: boolean
  isLoading: boolean
  error: string | null

  // Role Checking Helpers
  isAdmin: () => boolean
  isSupervisor: () => boolean
  canAccessSupervisorFeatures: () => boolean
  canAccessAdminFeatures: () => boolean

  // Actions
  setLoggedIn: (status: boolean) => void
  verifyUser: () => Promise<void>
  loginUser: (payload: Record<string, unknown>) => Promise<boolean>
  logoutUser: () => Promise<void>
  initIdleTimeout: (idleTimeMs?: number) => () => void
  startHeartbeat: () => () => void
}
