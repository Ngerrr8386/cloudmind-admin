import type { Tone } from './theme'

/** Full file-type union used by the shared FileTypeIcon / icons helper. */
export type FileType =
  | 'pdf' | 'doc' | 'sheet' | 'slide' | 'image'
  | 'video' | 'audio' | 'code' | 'archive' | 'note'

export type PlanName = 'Free' | 'Pro' | 'Team'
export type UserStatus = 'active' | 'trial' | 'suspended' | 'pending'

export interface ManagedUser {
  id: string
  name: string
  email: string
  initials: string
  tone: Tone
  plan: PlanName
  status: UserStatus
  storageUsed: number // bytes
  storageTotal: number // bytes
  filesCount: number
  aiCalls: number // this month
  joinedAt: string
  lastActive: string
  country: string
}

export type TxStatus = 'paid' | 'failed' | 'refunded' | 'pending'

export interface Transaction {
  id: string
  invoice: string
  userName: string
  userInitials: string
  userTone: Tone
  plan: PlanName
  amount: number // VND
  status: TxStatus
  method: string
  date: string
}

export type ContentStatus = 'clean' | 'flagged' | 'reviewing' | 'removed'
export type ContentFileType = 'pdf' | 'image' | 'video' | 'doc' | 'audio' | 'archive'

export interface ContentItem {
  id: string
  fileName: string
  fileType: ContentFileType
  ownerName: string
  ownerInitials: string
  ownerTone: Tone
  size: number
  status: ContentStatus
  reason?: string
  reports: number
  uploadedAt: string
}

export type Severity = 'info' | 'warning' | 'critical'

export interface AuditEntry {
  id: string
  actor: string
  actorInitials: string
  actorTone: Tone
  action: string
  target: string
  severity: Severity
  ip: string
  timestamp: string
}

export interface AdminPlan {
  id: string
  name: PlanName
  priceMonthly: number
  tone: Tone
  subscribers: number
  mrr: number // VND
  storage: string
  active: boolean
  features: string[]
}

export type AdminRole = 'Owner' | 'Admin' | 'Moderator' | 'Support'

export interface TeamMember {
  id: string
  name: string
  email: string
  initials: string
  tone: Tone
  role: AdminRole
  lastActive: string
  online: boolean
}

export interface SupportTicket {
  id: string
  subject: string
  userName: string
  userInitials: string
  userTone: Tone
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'pending' | 'closed'
  createdAt: string
}
