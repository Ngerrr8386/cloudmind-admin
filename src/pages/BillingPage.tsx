import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  RotateCcw,
  TrendingUp,
  Wallet,
  XCircle,
  UserMinus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Receipt,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Button, Badge, GlassCard } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/ui';
import { EmptyState } from '@/components/shared/EmptyState';
import { tone, TONES, type Tone } from '@/lib/theme';
import { cn, formatNumber } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg, softSpring } from '@/lib/motion';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { initialsOf, toneOf } from '@/lib/adminMap';
import type { Transaction, PlanName } from '@/lib/types';

type TxFilter = 'all' | 'paid' | 'failed' | 'refunded' | 'pending';

/** Map một giao dịch từ backend → Transaction (shape render cũ). */
function toTransaction(t: any): Transaction {
  const name: string = t?.owner?.name ?? '—';
  const seed: string = t?.owner?.email ?? t?.owner?.name ?? t?.id ?? '';
  return {
    id: t?.id,
    invoice: t?.invoiceNo ?? '#' + (t?.orderCode ?? ''),
    userName: name,
    userInitials: initialsOf(name),
    userTone: toneOf(seed),
    plan: t?.planKey as PlanName,
    amount: t?.amount ?? 0,
    status: t?.status,
    method: 'PayOS',
    date: t?.paidAt ?? t?.createdAt ?? '',
  };
}

const TX_FILTERS: { key: TxFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'failed', label: 'Thất bại' },
  { key: 'refunded', label: 'Đã hoàn' },
  { key: 'pending', label: 'Chờ' },
];

const PLAN_TONE: Record<PlanName, Tone> = {
  Free: 'slate',
  Pro: 'indigo',
  Team: 'violet',
};

const PLAN_BADGE_TONE: Record<PlanName, 'neutral' | 'brand' | 'ai'> = {
  Free: 'neutral',
  Pro: 'brand',
  Team: 'ai',
};

function formatVnd(amount: number): string {
  return formatNumber(amount) + 'đ';
}

function ChartTooltipStyle() {
  return {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    color: '#0f172a',
    boxShadow: '0 8px 24px -12px rgba(16,24,40,0.2)',
  } as const;
}

export function BillingPage() {
  const [filter, setFilter] = useState<TxFilter>('all');

  const { data: metrics } = useAsync(() => api.billingMetrics(), []);
  const { data: kpiData } = useAsync(() => api.kpis(), []);
  const { data: revenueData } = useAsync(() => api.revenue(), []);
  const { data: failedRaw } = useAsync(() => api.failedTransactions(), []);
  const {
    data: txData,
    loading: txLoading,
    reload: reloadTx,
  } = useAsync(
    () => api.transactions({ status: filter === 'all' ? undefined : filter }),
    [filter],
  );

  const revenueMonthly = useMemo(
    () => (Array.isArray(revenueData) ? revenueData : []),
    [revenueData],
  );

  const failedTransactions = useMemo<Transaction[]>(
    () => (Array.isArray(failedRaw) ? failedRaw.map(toTransaction) : []),
    [failedRaw],
  );

  const filteredTransactions = useMemo<Transaction[]>(
    () => (Array.isArray(txData?.items) ? txData!.items.map(toTransaction) : []),
    [txData],
  );

  const totalTransactions = txData?.meta?.total ?? filteredTransactions.length;

  const planRevenueData = useMemo<
    { name: string; mrr: number; hex: string }[]
  >(
    () =>
      ((metrics?.byPlan ?? []) as { plan: string; revenue: number }[]).map(
        (p) => ({
          name: p.plan,
          mrr: Math.round((p.revenue ?? 0) / 1e6),
          hex: tone(toneOf(p.plan)).hex,
        }),
      ),
    [metrics],
  );

  const mrr = metrics?.mrr ?? 0;
  const arr = metrics?.arr ?? mrr * 12;
  const failedCount = metrics?.failedCount ?? failedTransactions.length;
  const mrrTy = (mrr / 1e9).toFixed(2);
  const arrTy = (arr / 1e9).toFixed(1);
  const churnRate = kpiData?.churnRate ?? 0;

  async function handleRefund(id: string) {
    try {
      await api.refund(id);
      reloadTx();
    } catch {
      /* lỗi: bỏ qua, không crash */
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Doanh thu & Thanh toán"
        subtitle="Theo dõi MRR, giao dịch và hoàn tiền"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="glass" size="md">
              <Download className="h-4 w-4" />
              Xuất hóa đơn
            </Button>
            <Button variant="primary" size="md">
              <RotateCcw className="h-4 w-4" />
              Tạo hoàn tiền
            </Button>
          </div>
        }
      />

      {/* KPI StatCards */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Wallet}
            label="MRR"
            value={mrrTy}
            suffix=" tỷ đ"
            tone="emerald"
            trend={8}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={TrendingUp}
            label="ARR"
            value={arrTy}
            suffix=" tỷ đ"
            tone="indigo"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={XCircle}
            label="Giao dịch thất bại"
            value={formatNumber(failedCount)}
            tone="rose"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={UserMinus}
            label="Tỉ lệ rời bỏ"
            value={churnRate + '%'}
            tone="amber"
            trend={-0.3}
          />
        </motion.div>
      </motion.div>

      {/* Charts row */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 lg:grid-cols-5"
      >
        <motion.div variants={fadeUpLg} className="lg:col-span-3">
          <GlassCard className="p-5">
            <div className="mb-1 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Doanh thu theo tháng
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  Đơn vị: triệu đồng
                </p>
              </div>
              <Badge tone="mint" dot>
                Đang tăng trưởng
              </Badge>
            </div>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={revenueMonthly}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={TONES.emerald.hex}
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="100%"
                        stopColor={TONES.emerald.hex}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={ChartTooltipStyle()}
                    cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                    formatter={(value: number) => [
                      formatNumber(value) + ' triệu đ',
                      'Doanh thu',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={TONES.emerald.hex}
                    strokeWidth={2.5}
                    fill="url(#revFill)"
                    dot={{ r: 3, fill: TONES.emerald.hex, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUpLg} className="lg:col-span-2">
          <GlassCard className="p-5">
            <div className="mb-1">
              <h2 className="text-base font-semibold text-slate-900">
                Doanh thu theo gói
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                MRR theo từng gói (triệu đồng)
              </p>
            </div>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={planRevenueData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={ChartTooltipStyle()}
                    cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                    formatter={(value: number) => [
                      formatNumber(value) + ' triệu đ',
                      'MRR',
                    ]}
                  />
                  <Bar dataKey="mrr" radius={[8, 8, 0, 0]} maxBarSize={56}>
                    {planRevenueData.map((entry) => (
                      <Cell key={entry.name} fill={entry.hex} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {planRevenueData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: entry.hex }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-500">
                      {entry.name}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatNumber(entry.mrr)}tr
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Failed payments callout */}
      {failedTransactions.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={softSpring}
        >
          <div className="flex flex-col gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-rose-900">
                  Thanh toán thất bại cần xử lý
                </h3>
                <p className="mt-0.5 text-sm text-rose-700">
                  Có{' '}
                  <span className="font-semibold">
                    {formatNumber(failedTransactions.length)} giao dịch
                  </span>{' '}
                  thất bại với tổng giá trị{' '}
                  <span className="font-semibold">
                    {formatVnd(
                      failedTransactions.reduce(
                        (sum: number, t: Transaction) => sum + t.amount,
                        0,
                      ),
                    )}
                  </span>
                  . Vui lòng liên hệ khách hàng hoặc thử lại thanh toán.
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              size="md"
              className="shrink-0"
              onClick={() => setFilter('failed')}
            >
              <CreditCard className="h-4 w-4" />
              Xử lý ngay
            </Button>
          </div>
        </motion.div>
      )}

      {/* Transactions section */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={softSpring}
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Receipt className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Lịch sử giao dịch
              </h2>
              <p className="text-sm text-slate-400">
                {formatNumber(totalTransactions)} giao dịch
              </p>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {TX_FILTERS.map((f) => {
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {txLoading ? (
          <div className="flex items-center justify-center rounded-3xl bg-white border border-slate-200 shadow-card py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-card">
            <EmptyState
              icon={Receipt}
              title="Không có giao dịch"
              description="Không tìm thấy giao dịch nào khớp với bộ lọc hiện tại."
              action={
                <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                  Xóa bộ lọc
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200 shadow-card">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Hóa đơn</th>
                  <th className="px-5 py-3.5">Khách hàng</th>
                  <th className="px-5 py-3.5">Gói</th>
                  <th className="px-5 py-3.5">Số tiền</th>
                  <th className="px-5 py-3.5">Phương thức</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Ngày</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t: Transaction) => (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-medium text-slate-700">
                        {t.invoice}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={t.userInitials}
                          tone={t.userTone}
                          size="sm"
                        />
                        <span className="font-medium text-slate-800">
                          {t.userName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={PLAN_BADGE_TONE[t.plan as PlanName]}>
                        {t.plan}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">
                        {formatVnd(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{t.method}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {t.date ? new Date(t.date).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {t.status === 'paid' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Hoàn tiền"
                            onClick={() => handleRefund(t.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" aria-label="Thêm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td colSpan={8} className="px-5 py-3.5">
                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                      <p className="text-xs text-slate-400">
                        Hiển thị 1–{formatNumber(filteredTransactions.length)} /
                        tổng {formatNumber(totalTransactions)} giao dịch
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled>
                          <ChevronLeft className="h-4 w-4" />
                          Trước
                        </Button>
                        <Button variant="outline" size="sm">
                          Sau
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}