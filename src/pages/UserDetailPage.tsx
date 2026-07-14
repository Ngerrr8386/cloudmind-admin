import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCcw,
  KeyRound,
  LogIn,
  Lock,
  Unlock,
  HardDrive,
  Files,
  Sparkles,
  CreditCard,
  Mail,
  Globe,
  Calendar,
  Activity,
  IdCard,
  type LucideIcon,
} from 'lucide-react';
import {
  Button,
  Badge,
  GlassCard,
  Avatar,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatBytes, formatNumber, timeAgo } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg, softSpring } from '@/lib/motion';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { initialsOf, toneOf } from '@/lib/adminMap';
import type { ManagedUser, Transaction, PlanName } from '@/lib/types';

/** Map raw user từ API → ManagedUser dùng cho render. */
function mapUser(raw: any): ManagedUser {
  const name: string = raw?.name ?? '';
  const createdAt: string = raw?.createdAt ?? new Date().toISOString();
  return {
    id: raw?.id ?? '',
    name,
    email: raw?.email ?? '',
    initials: initialsOf(name),
    tone: toneOf(raw?.id ?? raw?.email),
    plan: (raw?.plan ?? 'Free') as PlanName,
    status: raw?.status ?? 'active',
    storageUsed: raw?.storageUsed ?? 0,
    storageTotal: raw?.storageTotal ?? 0,
    filesCount: 0,
    aiCalls: 0,
    joinedAt: createdAt,
    lastActive: raw?.lastActiveAt ?? createdAt,
    country: '—',
  };
}

/** Map raw transaction từ API → Transaction dùng cho bảng thanh toán. */
function mapTransaction(raw: any): Transaction {
  const ownerName: string = raw?.owner?.name ?? '';
  return {
    id: raw?.id ?? '',
    invoice: raw?.invoiceNo ?? '#' + (raw?.orderCode ?? ''),
    userName: ownerName,
    userInitials: initialsOf(ownerName),
    userTone: toneOf(raw?.owner?.email ?? ownerName),
    plan: (raw?.planKey ?? 'Free') as Transaction['plan'],
    amount: raw?.amount ?? 0,
    status: raw?.status ?? 'pending',
    method: 'PayOS',
    date: raw?.paidAt ?? raw?.createdAt ?? new Date().toISOString(),
  };
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-2.5 text-slate-500">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-50 text-slate-400">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-right text-sm font-medium text-slate-800">{children}</div>
    </div>
  );
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: rawUser, loading, reload } = useAsync(() => api.user(id!), [id]);
  const { data: filesData } = useAsync(() => api.userFiles(id!), [id]);
  const { data: txData } = useAsync(() => api.userTransactions(id!), [id]);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Loading khi đang tải hồ sơ
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  // 404 nếu không có người dùng
  if (!rawUser) {
    return (
      <div className="space-y-6">
        <Link
          to="/users"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách người dùng
        </Link>
        <GlassCard className="grid place-items-center p-12 text-center">
          <p className="text-base font-semibold text-slate-900">Không tìm thấy người dùng</p>
          <p className="mt-1 text-sm text-slate-500">
            Tài khoản này có thể đã bị xóa hoặc không tồn tại.
          </p>
        </GlassCard>
      </div>
    );
  }

  const user = mapUser(rawUser);
  const files = filesData?.items ?? [];
  user.filesCount = files.length;

  const suspended = user.status === 'suspended';

  const joinedLabel = new Date(user.joinedAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const billingRows: Transaction[] = ((txData as any[]) ?? []).map(mapTransaction);

  const formatStatus = (status: Transaction['status']) => status;

  async function runAction(fn: () => Promise<any>, message?: string) {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fn();
      if (message) {
        const otp = res?.devOtp ?? res?.otp;
        setNotice(otp ? `${message} (OTP: ${otp})` : message);
      }
      reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  }

  async function handleChangePlan() {
    const order: PlanName[] = ['Free', 'Pro', 'Team'];
    const next = order[(order.indexOf(user.plan) + 1) % order.length];
    await runAction(() => api.changeUserPlan(user.id, next), `Đã đổi gói sang ${next}`);
  }

  async function handleToggleSuspend() {
    if (suspended) await runAction(() => api.unsuspendUser(user.id), 'Đã mở khóa tài khoản');
    else await runAction(() => api.suspendUser(user.id), 'Đã tạm khóa tài khoản');
  }

  async function handleResetPassword() {
    await runAction(() => api.resetUserPassword(user.id), 'Đã gửi yêu cầu đặt lại mật khẩu');
  }

  async function handleImpersonate() {
    await runAction(() => api.impersonate(user.id), 'Đã tạo phiên đăng nhập thay');
  }

  return (
    <div className="space-y-6">
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách người dùng
      </Link>

      <PageHeader
        eyebrow="Quản lý người dùng"
        title={user.name}
        subtitle="Hồ sơ chi tiết, lịch sử hoạt động và quản trị tài khoản"
      />

      {notice && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-700">
          {notice}
        </div>
      )}

      {/* Header card */}
      <motion.div variants={fadeUpLg} initial="hidden" animate="show">
        <GlassCard className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar initials={user.initials} tone={user.tone} size="lg" ring />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                  <StatusBadge status={user.status} />
                </div>
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">Gói {user.plan}</Badge>
                  <Badge tone="neutral">{user.country}</Badge>
                  <span className="text-xs text-slate-400">Tham gia {joinedLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Button size="sm" className="gap-1.5" disabled={busy} onClick={handleChangePlan}>
                <RefreshCcw className="h-4 w-4" />
                Đổi gói
              </Button>
              <Button variant="glass" size="sm" className="gap-1.5" disabled={busy} onClick={handleResetPassword}>
                <KeyRound className="h-4 w-4" />
                Đặt lại mật khẩu
              </Button>
              <Button variant="glass" size="sm" className="gap-1.5" disabled={busy} onClick={handleImpersonate}>
                <LogIn className="h-4 w-4" />
                Đăng nhập thay
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="gap-1.5"
                disabled={busy}
                onClick={handleToggleSuspend}
              >
                {suspended ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {suspended ? 'Mở khóa' : 'Tạm khóa'}
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          icon={HardDrive}
          label="Dung lượng"
          value={formatBytes(user.storageUsed)}
          suffix={'/ ' + formatBytes(user.storageTotal, 0)}
          tone="indigo"
        />
        <StatCard
          icon={Files}
          label="Tổng file"
          value={formatNumber(user.filesCount)}
          tone="blue"
        />
        <StatCard
          icon={Sparkles}
          label="Lượt AI tháng"
          value={formatNumber(user.aiCalls)}
          tone="violet"
        />
        <StatCard
          icon={CreditCard}
          label="Gói hiện tại"
          value={user.plan}
          tone="emerald"
        />
      </motion.div>

      {/* Two column */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-6 lg:col-span-2">
          {/* Billing history */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Lịch sử thanh toán</h3>
              <Badge tone="mint">{billingRows.length} giao dịch</Badge>
            </div>
            <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200 shadow-card">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Hóa đơn</th>
                    <th className="px-5 py-3.5">Số tiền</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billingRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                        Chưa có giao dịch nào
                      </td>
                    </tr>
                  ) : (
                    billingRows.map((tx) => (
                      <tr key={tx.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                              <CreditCard className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-medium text-slate-800">{tx.invoice}</p>
                              <p className="text-xs text-slate-400">{tx.method}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {tx.amount > 0 ? formatNumber(tx.amount) + 'đ' : 'Miễn phí'}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={formatStatus(tx.status)} />
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {new Date(tx.date).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="flex items-center border-t border-slate-200 px-5 py-3.5 text-xs text-slate-400">
                <span>
                  Hiển thị 1–{billingRows.length} / tổng {billingRows.length}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Info */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={softSpring}
          >
            <GlassCard className="p-6">
              <h3 className="mb-2 text-base font-semibold text-slate-900">Thông tin</h3>
              <div className="divide-y divide-slate-100">
                <DetailRow icon={IdCard} label="ID người dùng">
                  <span className="font-mono text-xs text-slate-500">{user.id}</span>
                </DetailRow>
                <DetailRow icon={Mail} label="Email">
                  {user.email}
                </DetailRow>
                <DetailRow icon={Globe} label="Quốc gia">
                  {user.country}
                </DetailRow>
                <DetailRow icon={CreditCard} label="Gói">
                  <Badge tone="brand">{user.plan}</Badge>
                </DetailRow>
                <DetailRow icon={Activity} label="Trạng thái">
                  <StatusBadge status={user.status} />
                </DetailRow>
                <DetailRow icon={Calendar} label="Ngày tham gia">
                  {joinedLabel}
                </DetailRow>
                <DetailRow icon={Activity} label="Hoạt động cuối">
                  {timeAgo(user.lastActive)}
                </DetailRow>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
