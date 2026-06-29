/* API client cho CloudMind Admin — token + auto-refresh + envelope. */

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4100/api/v1'

const ACCESS_KEY = 'cm_admin_access'
const REFRESH_KEY = 'cm_admin_refresh'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}
export function setTokens(access?: string, refresh?: string): void {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

interface ReqOpts {
  auth?: boolean
  raw?: boolean // trả nguyên envelope { success, data, meta }
}

let refreshPromise: Promise<boolean> | null = null
async function doRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const json = await res.json()
    setTokens(json.data?.accessToken, json.data?.refreshToken)
    return Boolean(json.data?.accessToken)
  } catch {
    return false
  }
}
function refreshAccess(): Promise<boolean> {
  if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null })
  return refreshPromise
}

async function request<T = any>(method: string, path: string, body?: unknown, opts: ReqOpts = {}, _retried = false): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  const token = opts.auth === false ? null : getAccessToken()
  if (token) headers.authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 401 && !_retried && opts.auth !== false && path !== '/auth/refresh') {
    if (await refreshAccess()) return request<T>(method, path, body, opts, true)
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.success === false) {
    const err = json?.error ?? {}
    throw new ApiError(res.status, err.code ?? 'ERROR', err.message ?? `Lỗi ${res.status}`)
  }
  return (opts.raw ? json : json.data) as T
}

const get = <T = any>(p: string, opts?: ReqOpts) => request<T>('GET', p, undefined, opts)
const post = <T = any>(p: string, b?: unknown) => request<T>('POST', p, b)
const patch = <T = any>(p: string, b?: unknown) => request<T>('PATCH', p, b)
const del = <T = any>(p: string) => request<T>('DELETE', p)
const qs = (params: Record<string, unknown> = {}) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== null) s.set(k, String(v))
  const str = s.toString()
  return str ? `?${str}` : ''
}
/** GET list → { items, meta } (bóc envelope đầy đủ). */
const list = (p: string, params?: Record<string, unknown>) =>
  get<any>(`${p}${qs(params)}`, { raw: true }).then((j) => ({ items: (j?.data ?? []) as any[], meta: j?.meta }))

export const api = {
  // ---------- Auth ----------
  login: (b: { email: string; password: string }) => post('/auth/login', b),
  me: () => get('/auth/me'),
  logout: () => post('/auth/logout', {}),

  // ---------- Tổng quan ----------
  kpis: () => get('/admin/overview/kpis'),
  revenue: () => get('/admin/overview/revenue'),
  userGrowth: () => get('/admin/overview/user-growth'),
  planDistribution: () => get('/admin/overview/plan-distribution'),
  systemHealth: () => get('/admin/overview/system-health'),
  recent: () => get('/admin/overview/recent'),

  // ---------- Người dùng ----------
  users: (params?: Record<string, unknown>) => list('/admin/users', params),
  user: (id: string) => get(`/admin/users/${id}`),
  createUser: (b: Record<string, unknown>) => post('/admin/users', b),
  updateUser: (id: string, b: Record<string, unknown>) => patch(`/admin/users/${id}`, b),
  changeUserPlan: (id: string, plan: string) => patch(`/admin/users/${id}/plan`, { plan }),
  suspendUser: (id: string) => post(`/admin/users/${id}/suspend`, {}),
  unsuspendUser: (id: string) => post(`/admin/users/${id}/unsuspend`, {}),
  resetUserPassword: (id: string) => post(`/admin/users/${id}/reset-password`, {}),
  impersonate: (id: string) => post(`/admin/users/${id}/impersonate`, {}),
  userFiles: (id: string) => list(`/admin/users/${id}/files`),
  userTransactions: (id: string) => get(`/admin/users/${id}/transactions`),
  deleteUser: (id: string) => del(`/admin/users/${id}`),

  // ---------- Nội dung & kiểm duyệt ----------
  content: (params?: Record<string, unknown>) => list('/admin/content', params),
  contentQueue: () => get('/admin/content/queue'),
  contentItem: (id: string) => get(`/admin/content/${id}`),
  approveContent: (id: string) => post(`/admin/content/${id}/approve`, {}),
  removeContent: (id: string) => post(`/admin/content/${id}/remove`, {}),
  reports: () => get('/admin/reports'),
  resolveReport: (id: string, action?: string) => post(`/admin/reports/${id}/resolve`, { action }),

  // ---------- Doanh thu ----------
  billingMetrics: () => get('/admin/billing/metrics'),
  transactions: (params?: Record<string, unknown>) => list('/admin/billing/transactions', params),
  transaction: (id: string) => get(`/admin/billing/transactions/${id}`),
  refund: (id: string) => post(`/admin/billing/transactions/${id}/refund`, {}),
  failedTransactions: () => get('/admin/billing/failed'),
  invoices: (params?: Record<string, unknown>) => list('/admin/billing/invoices', params),

  // ---------- Gói cước ----------
  plans: () => get('/admin/plans'),
  createPlan: (b: Record<string, unknown>) => post('/admin/plans', b),
  plan: (id: string) => get(`/admin/plans/${id}`),
  updatePlan: (id: string, b: Record<string, unknown>) => patch(`/admin/plans/${id}`, b),
  togglePlan: (id: string) => post(`/admin/plans/${id}/toggle`, {}),
  planSubscribers: (id: string) => list(`/admin/plans/${id}/subscribers`),
  deletePlan: (id: string) => del(`/admin/plans/${id}`),

  // ---------- Phân tích AI ----------
  aiMetrics: () => get('/admin/ai/metrics'),
  aiByFeature: () => get('/admin/ai/by-feature'),
  aiDailyTrend: () => get('/admin/ai/daily-trend'),
  aiTopQueries: () => get('/admin/ai/top-queries'),
  aiCost: () => get('/admin/ai/cost'),

  // ---------- Nhật ký ----------
  audit: (params?: Record<string, unknown>) => list('/admin/audit', params),
  auditEntry: (id: string) => get(`/admin/audit/${id}`),
  auditExport: () => get('/admin/audit/export'),

  // ---------- Cài đặt & Đội ngũ ----------
  settings: () => get('/admin/settings'),
  updateGeneral: (b: Record<string, unknown>) => patch('/admin/settings/general', b),
  updateAiSettings: (b: Record<string, unknown>) => patch('/admin/settings/ai', b),
  updateLimits: (b: Record<string, unknown>) => patch('/admin/settings/limits', b),
  updateSecurity: (b: Record<string, unknown>) => patch('/admin/settings/security', b),
  team: () => get('/admin/team'),
  inviteTeam: (b: { email: string; name?: string }) => post('/admin/team/invite', b),
  updateTeamRole: (id: string, role: string) => patch(`/admin/team/${id}/role`, { role }),
  removeTeam: (id: string) => del(`/admin/team/${id}`),
  integrations: () => get('/admin/integrations'),
  updateIntegration: (key: string, b: Record<string, unknown>) => patch(`/admin/integrations/${key}`, b),

  // ---------- Workspaces ----------
  workspaces: (params?: Record<string, unknown>) => list('/admin/workspaces', params),
  workspace: (id: string) => get(`/admin/workspaces/${id}`),
  workspaceMembers: (id: string) => get(`/admin/workspaces/${id}/members`),
  suspendWorkspace: (id: string, suspend: boolean) => post(`/admin/workspaces/${id}/suspend`, { suspend }),
  updateWorkspaceSeats: (id: string, seats: number) => patch(`/admin/workspaces/${id}/seats`, { seats }),
}
