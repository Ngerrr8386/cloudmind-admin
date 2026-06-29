import type {
  ManagedUser, Transaction, ContentItem, AuditEntry, AdminPlan, TeamMember, SupportTicket,
} from './types'

/** The currently logged-in admin. */
export const currentAdmin = {
  name: 'Hải Đăng',
  email: 'admin@cloudmind.vn',
  initials: 'HĐ',
  tone: 'indigo' as const,
  role: 'Owner' as const,
}

export const managedUsers: ManagedUser[] = [
  { id: 'u-001', name: 'Minh Anh', email: 'minhanh@gmail.com', initials: 'MA', tone: 'violet', plan: 'Pro', status: 'active', storageUsed: 68_400_000_000, storageTotal: 536_870_912_000, filesCount: 349, aiCalls: 128, joinedAt: '2025-11-02', lastActive: '2026-06-28T08:40:00', country: 'Việt Nam' },
  { id: 'u-002', name: 'Quốc Huy', email: 'huy.q@startup.io', initials: 'QH', tone: 'emerald', plan: 'Team', status: 'active', storageUsed: 1_240_000_000_000, storageTotal: 2_199_023_255_552, filesCount: 1820, aiCalls: 642, joinedAt: '2025-08-15', lastActive: '2026-06-28T07:10:00', country: 'Việt Nam' },
  { id: 'u-003', name: 'Bảo Trân', email: 'tran.bao@uni.edu.vn', initials: 'BT', tone: 'amber', plan: 'Pro', status: 'trial', storageUsed: 8_200_000_000, storageTotal: 536_870_912_000, filesCount: 64, aiCalls: 41, joinedAt: '2026-06-20', lastActive: '2026-06-27T22:05:00', country: 'Việt Nam' },
  { id: 'u-004', name: 'Lan Vy', email: 'vy.lan@creator.vn', initials: 'LV', tone: 'rose', plan: 'Pro', status: 'active', storageUsed: 210_000_000_000, storageTotal: 536_870_912_000, filesCount: 980, aiCalls: 305, joinedAt: '2025-12-11', lastActive: '2026-06-28T06:30:00', country: 'Việt Nam' },
  { id: 'u-005', name: 'Đức Minh', email: 'minh.d@data.co', initials: 'DM', tone: 'indigo', plan: 'Team', status: 'active', storageUsed: 720_000_000_000, storageTotal: 2_199_023_255_552, filesCount: 2410, aiCalls: 511, joinedAt: '2025-09-03', lastActive: '2026-06-26T18:20:00', country: 'Singapore' },
  { id: 'u-006', name: 'Thu Hà', email: 'ha.thu@gmail.com', initials: 'TH', tone: 'blue', plan: 'Free', status: 'active', storageUsed: 9_800_000_000, storageTotal: 16_106_127_360, filesCount: 88, aiCalls: 12, joinedAt: '2026-03-22', lastActive: '2026-06-25T09:15:00', country: 'Việt Nam' },
  { id: 'u-007', name: 'Gia Bảo', email: 'bao.gia@gmail.com', initials: 'GB', tone: 'violet', plan: 'Free', status: 'suspended', storageUsed: 15_900_000_000, storageTotal: 16_106_127_360, filesCount: 204, aiCalls: 0, joinedAt: '2026-01-18', lastActive: '2026-05-30T14:00:00', country: 'Việt Nam' },
  { id: 'u-008', name: 'Khánh Linh', email: 'linh.k@agency.vn', initials: 'KL', tone: 'emerald', plan: 'Pro', status: 'active', storageUsed: 312_000_000_000, storageTotal: 536_870_912_000, filesCount: 1340, aiCalls: 224, joinedAt: '2025-10-29', lastActive: '2026-06-28T05:50:00', country: 'Việt Nam' },
  { id: 'u-009', name: 'Tuấn Kiệt', email: 'kiet.t@gmail.com', initials: 'TK', tone: 'amber', plan: 'Free', status: 'pending', storageUsed: 1_200_000_000, storageTotal: 16_106_127_360, filesCount: 9, aiCalls: 3, joinedAt: '2026-06-27', lastActive: '2026-06-27T11:00:00', country: 'Việt Nam' },
  { id: 'u-010', name: 'Mỹ Duyên', email: 'duyen.my@shop.vn', initials: 'MD', tone: 'rose', plan: 'Pro', status: 'active', storageUsed: 156_000_000_000, storageTotal: 536_870_912_000, filesCount: 670, aiCalls: 189, joinedAt: '2026-02-14', lastActive: '2026-06-28T04:25:00', country: 'Việt Nam' },
  { id: 'u-011', name: 'Hoàng Nam', email: 'nam.h@corp.com', initials: 'HN', tone: 'blue', plan: 'Team', status: 'trial', storageUsed: 88_000_000_000, storageTotal: 2_199_023_255_552, filesCount: 430, aiCalls: 97, joinedAt: '2026-06-15', lastActive: '2026-06-28T03:10:00', country: 'Hoa Kỳ' },
  { id: 'u-012', name: 'Phương Thảo', email: 'thao.p@gmail.com', initials: 'PT', tone: 'indigo', plan: 'Pro', status: 'active', storageUsed: 240_000_000_000, storageTotal: 536_870_912_000, filesCount: 1100, aiCalls: 276, joinedAt: '2025-07-08', lastActive: '2026-06-27T20:40:00', country: 'Việt Nam' },
]

export const transactions: Transaction[] = [
  { id: 't-9001', invoice: 'INV-2026-9001', userName: 'Quốc Huy', userInitials: 'QH', userTone: 'emerald', plan: 'Team', amount: 1990000, status: 'paid', method: 'Visa •• 4242', date: '2026-06-28T02:14:00' },
  { id: 't-9002', invoice: 'INV-2026-9002', userName: 'Minh Anh', userInitials: 'MA', userTone: 'violet', plan: 'Pro', amount: 79000, status: 'paid', method: 'MoMo', date: '2026-06-27T19:30:00' },
  { id: 't-9003', invoice: 'INV-2026-9003', userName: 'Lan Vy', userInitials: 'LV', userTone: 'rose', plan: 'Pro', amount: 79000, status: 'paid', method: 'Mastercard •• 5511', date: '2026-06-27T12:05:00' },
  { id: 't-9004', invoice: 'INV-2026-9004', userName: 'Gia Bảo', userInitials: 'GB', userTone: 'violet', plan: 'Pro', amount: 99000, status: 'failed', method: 'Visa •• 0198', date: '2026-06-27T09:48:00' },
  { id: 't-9005', invoice: 'INV-2026-9005', userName: 'Đức Minh', userInitials: 'DM', userTone: 'indigo', plan: 'Team', amount: 1990000, status: 'paid', method: 'Bank transfer', date: '2026-06-26T16:20:00' },
  { id: 't-9006', invoice: 'INV-2026-9006', userName: 'Mỹ Duyên', userInitials: 'MD', userTone: 'rose', plan: 'Pro', amount: 79000, status: 'refunded', method: 'ZaloPay', date: '2026-06-26T10:00:00' },
  { id: 't-9007', invoice: 'INV-2026-9007', userName: 'Khánh Linh', userInitials: 'KL', userTone: 'emerald', plan: 'Pro', amount: 79000, status: 'paid', method: 'Visa •• 7733', date: '2026-06-25T22:41:00' },
  { id: 't-9008', invoice: 'INV-2026-9008', userName: 'Phương Thảo', userInitials: 'PT', userTone: 'indigo', plan: 'Pro', amount: 79000, status: 'paid', method: 'MoMo', date: '2026-06-25T14:12:00' },
  { id: 't-9009', invoice: 'INV-2026-9009', userName: 'Hoàng Nam', userInitials: 'HN', userTone: 'blue', plan: 'Team', amount: 1990000, status: 'pending', method: 'Bank transfer', date: '2026-06-25T08:30:00' },
  { id: 't-9010', invoice: 'INV-2026-9010', userName: 'Thu Hà', userInitials: 'TH', userTone: 'blue', plan: 'Pro', amount: 99000, status: 'failed', method: 'Visa •• 1002', date: '2026-06-24T17:55:00' },
]

export const contentItems: ContentItem[] = [
  { id: 'c-001', fileName: 'tai-lieu-noi-bo-2026.pdf', fileType: 'pdf', ownerName: 'Đức Minh', ownerInitials: 'DM', ownerTone: 'indigo', size: 8_400_000, status: 'flagged', reason: 'Nghi ngờ chứa dữ liệu nhạy cảm', reports: 3, uploadedAt: '2026-06-27T15:00:00' },
  { id: 'c-002', fileName: 'banner-quang-cao.png', fileType: 'image', ownerName: 'Lan Vy', ownerInitials: 'LV', ownerTone: 'rose', size: 6_700_000, status: 'reviewing', reason: 'Báo cáo vi phạm bản quyền', reports: 2, uploadedAt: '2026-06-27T11:20:00' },
  { id: 'c-003', fileName: 'demo-san-pham.mp4', fileType: 'video', ownerName: 'Minh Anh', ownerInitials: 'MA', ownerTone: 'violet', size: 184_000_000, status: 'clean', reports: 0, uploadedAt: '2026-06-26T09:00:00' },
  { id: 'c-004', fileName: 'spam-link-list.doc', fileType: 'doc', ownerName: 'Gia Bảo', ownerInitials: 'GB', ownerTone: 'violet', size: 120_000, status: 'removed', reason: 'Phát tán spam', reports: 7, uploadedAt: '2026-06-25T22:00:00' },
  { id: 'c-005', fileName: 'podcast-ai.mp3', fileType: 'audio', ownerName: 'Bảo Trân', ownerInitials: 'BT', ownerTone: 'amber', size: 42_000_000, status: 'clean', reports: 0, uploadedAt: '2026-06-25T18:30:00' },
  { id: 'c-006', fileName: 'tong-hop-anh.zip', fileType: 'archive', ownerName: 'Khánh Linh', ownerInitials: 'KL', ownerTone: 'emerald', size: 1_200_000_000, status: 'flagged', reason: 'Dung lượng bất thường', reports: 1, uploadedAt: '2026-06-24T13:10:00' },
  { id: 'c-007', fileName: 'hop-dong-mau.pdf', fileType: 'pdf', ownerName: 'Phương Thảo', ownerInitials: 'PT', ownerTone: 'indigo', size: 3_100_000, status: 'clean', reports: 0, uploadedAt: '2026-06-24T08:45:00' },
  { id: 'c-008', fileName: 'hinh-anh-nhay-cam.jpg', fileType: 'image', ownerName: 'Mỹ Duyên', ownerInitials: 'MD', ownerTone: 'rose', size: 4_200_000, status: 'reviewing', reason: 'Nội dung không phù hợp', reports: 5, uploadedAt: '2026-06-23T20:15:00' },
]

export const auditLog: AuditEntry[] = [
  { id: 'a-001', actor: 'Hải Đăng', actorInitials: 'HĐ', actorTone: 'indigo', action: 'Khóa tài khoản người dùng', target: 'Gia Bảo (u-007)', severity: 'critical', ip: '116.96.44.21', timestamp: '2026-06-28T08:12:00' },
  { id: 'a-002', actor: 'Hệ thống', actorInitials: 'SY', actorTone: 'slate', action: 'Phát hiện đăng nhập bất thường', target: 'u-011 · Hoa Kỳ', severity: 'warning', ip: '72.14.201.9', timestamp: '2026-06-28T06:40:00' },
  { id: 'a-003', actor: 'Thu Hương', actorInitials: 'TH', actorTone: 'rose', action: 'Gỡ nội dung vi phạm', target: 'spam-link-list.doc', severity: 'warning', ip: '116.96.44.30', timestamp: '2026-06-27T22:05:00' },
  { id: 'a-004', actor: 'Hải Đăng', actorInitials: 'HĐ', actorTone: 'indigo', action: 'Cập nhật gói cước', target: 'Gói Pro · giá 99.000đ', severity: 'info', ip: '116.96.44.21', timestamp: '2026-06-27T15:30:00' },
  { id: 'a-005', actor: 'Hệ thống', actorInitials: 'SY', actorTone: 'slate', action: 'Sao lưu cơ sở dữ liệu', target: 'snapshot-2026-06-27', severity: 'info', ip: 'internal', timestamp: '2026-06-27T03:00:00' },
  { id: 'a-006', actor: 'Minh Quân', actorInitials: 'MQ', actorTone: 'emerald', action: 'Hoàn tiền giao dịch', target: 'INV-2026-9006', severity: 'warning', ip: '113.161.7.88', timestamp: '2026-06-26T10:05:00' },
  { id: 'a-007', actor: 'Hải Đăng', actorInitials: 'HĐ', actorTone: 'indigo', action: 'Thêm thành viên quản trị', target: 'Minh Quân · Support', severity: 'info', ip: '116.96.44.21', timestamp: '2026-06-25T09:20:00' },
  { id: 'a-008', actor: 'Hệ thống', actorInitials: 'SY', actorTone: 'slate', action: 'Cảnh báo dung lượng máy chủ', target: 'node-storage-03 · 87%', severity: 'critical', ip: 'internal', timestamp: '2026-06-24T19:45:00' },
]

export const adminPlans: AdminPlan[] = [
  { id: 'p-free', name: 'Free', priceMonthly: 0, tone: 'slate', subscribers: 142_300, mrr: 0, storage: '15 GB', active: true, features: ['15 GB lưu trữ', 'Tìm kiếm cơ bản', '20 lượt AI/tháng'] },
  { id: 'p-pro', name: 'Pro', priceMonthly: 99000, tone: 'indigo', subscribers: 28_640, mrr: 2_835_360_000, storage: '500 GB', active: true, features: ['500 GB lưu trữ', 'AI không giới hạn', 'Tóm tắt & gợi ý thư mục'] },
  { id: 'p-team', name: 'Team', priceMonthly: 249000, tone: 'blue', subscribers: 4_120, mrr: 1_025_880_000, storage: '2 TB/người', active: true, features: ['2 TB/thành viên', 'Workspace chung', 'Phân quyền & nhật ký'] },
]

export const teamMembers: TeamMember[] = [
  { id: 'tm-1', name: 'Hải Đăng', email: 'admin@cloudmind.vn', initials: 'HĐ', tone: 'indigo', role: 'Owner', lastActive: 'Đang hoạt động', online: true },
  { id: 'tm-2', name: 'Thu Hương', email: 'huong.t@cloudmind.vn', initials: 'TH', tone: 'rose', role: 'Moderator', lastActive: '5 phút trước', online: true },
  { id: 'tm-3', name: 'Minh Quân', email: 'quan.m@cloudmind.vn', initials: 'MQ', tone: 'emerald', role: 'Support', lastActive: '1 giờ trước', online: false },
  { id: 'tm-4', name: 'Anh Tú', email: 'tu.a@cloudmind.vn', initials: 'AT', tone: 'blue', role: 'Admin', lastActive: 'Hôm qua', online: false },
  { id: 'tm-5', name: 'Ngọc Mai', email: 'mai.n@cloudmind.vn', initials: 'NM', tone: 'amber', role: 'Moderator', lastActive: '3 ngày trước', online: false },
]

export const supportTickets: SupportTicket[] = [
  { id: 'tk-1', subject: 'Không tải lên được file lớn hơn 1GB', userName: 'Đức Minh', userInitials: 'DM', userTone: 'indigo', priority: 'high', status: 'open', createdAt: '2026-06-28T07:00:00' },
  { id: 'tk-2', subject: 'Yêu cầu hoàn tiền gói Pro', userName: 'Mỹ Duyên', userInitials: 'MD', userTone: 'rose', priority: 'medium', status: 'pending', createdAt: '2026-06-27T13:20:00' },
  { id: 'tk-3', subject: 'AI trả lời sai nguồn tài liệu', userName: 'Bảo Trân', userInitials: 'BT', userTone: 'amber', priority: 'medium', status: 'open', createdAt: '2026-06-27T09:10:00' },
  { id: 'tk-4', subject: 'Cách nâng cấp lên Team?', userName: 'Hoàng Nam', userInitials: 'HN', userTone: 'blue', priority: 'low', status: 'closed', createdAt: '2026-06-26T16:40:00' },
]

/* ============================ CHART DATA ============================ */

/** Monthly revenue (triệu VND) + new users. */
export const revenueMonthly = [
  { month: 'T1', revenue: 2840, users: 9200 },
  { month: 'T2', revenue: 3120, users: 10400 },
  { month: 'T3', revenue: 3380, users: 11900 },
  { month: 'T4', revenue: 3290, users: 12600 },
  { month: 'T5', revenue: 3710, users: 14300 },
  { month: 'T6', revenue: 3861, users: 15800 },
]

/** User growth (cumulative, nghìn). */
export const userGrowth = [
  { month: 'T1', total: 120 },
  { month: 'T2', total: 134 },
  { month: 'T3', total: 148 },
  { month: 'T4', total: 159 },
  { month: 'T5', total: 168 },
  { month: 'T6', total: 175 },
]

/** Plan distribution (số người dùng) — hex for charts. */
export const planDistribution = [
  { name: 'Free', value: 142300, color: '#94a3b8' },
  { name: 'Pro', value: 28640, color: '#4f46e5' },
  { name: 'Team', value: 4120, color: '#0284c7' },
]

/** AI usage by feature (nghìn lượt / tháng). */
export const aiUsageByFeature = [
  { feature: 'Tìm kiếm', value: 412, color: '#4f46e5' },
  { feature: 'Hỏi đáp', value: 286, color: '#7c3aed' },
  { feature: 'Tóm tắt', value: 198, color: '#0284c7' },
  { feature: 'Gợi ý thư mục', value: 154, color: '#059669' },
  { feature: 'Tri thức', value: 92, color: '#d97706' },
]

/** Daily AI calls trend (nghìn). */
export const aiDailyTrend = [
  { day: 'T2', calls: 38 }, { day: 'T3', calls: 44 }, { day: 'T4', calls: 41 },
  { day: 'T5', calls: 52 }, { day: 'T6', calls: 58 }, { day: 'T7', calls: 34 }, { day: 'CN', calls: 29 },
]

/** Storage distribution across the fleet (TB). */
export const storageFleet = [
  { name: 'Tài liệu', value: 184, color: '#4f46e5' },
  { name: 'Ảnh & Video', value: 412, color: '#e11d48' },
  { name: 'Âm thanh', value: 96, color: '#059669' },
  { name: 'Khác', value: 138, color: '#d97706' },
]

/** Top AI queries this week. */
export const topQueries = [
  { query: 'kiến trúc RAG là gì', count: 4210 },
  { query: 'tóm tắt báo cáo tài chính', count: 3890 },
  { query: 'so sánh doanh thu theo quý', count: 3120 },
  { query: 'tài liệu về machine learning', count: 2740 },
  { query: 'hợp đồng sắp hết hạn', count: 2310 },
]

/** Headline KPIs for the overview. */
export const kpis = {
  totalUsers: 175060,
  activeUsers: 98420,
  mrr: 3_861_240_000, // VND
  storageUsed: 830, // TB
  storageTotal: 1200, // TB
  aiCallsMonth: 1_142_000,
  churnRate: 2.4,
  newUsersToday: 1240,
}

export const systemHealth = [
  { name: 'API', status: 'operational', uptime: '99.98%' },
  { name: 'Tìm kiếm AI', status: 'operational', uptime: '99.95%' },
  { name: 'Lưu trữ', status: 'degraded', uptime: '98.20%' },
  { name: 'Thanh toán', status: 'operational', uptime: '100%' },
]
