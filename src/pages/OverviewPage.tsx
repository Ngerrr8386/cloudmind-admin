import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Wallet,
  Activity,
  Sparkles,
  HardDrive,
  TrendingDown,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { GlassCard, Badge, Avatar, Button } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { tone, TONES, type Tone } from '@/lib/theme';
import { cn, formatNumber } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg, fadeIn } from '@/lib/motion';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { initialsOf, toneOf } from '@/lib/adminMap';
import type { PlanName } from '@/lib/types';

const CHART_AXIS = '#94a3b8';
const GRID = '#eef2f7';
const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#0f172a',
  boxShadow: '0 8px 24px -12px rgba(16,24,40,0.2)',
} as const;

const planTone: Record<PlanName, Tone> = {
  Free: 'slate',
  Pro: 'indigo',
  Team: 'violet',
};

const planBadgeTone: Record<PlanName, 'neutral' | 'brand' | 'ai'> = {
  Free: 'neutral',
  Pro: 'brand',
  Team: 'ai',
};

function planBadge(plan?: string): 'neutral' | 'brand' | 'ai' {
  return planBadgeTone[(plan as PlanName)] ?? 'neutral';
}

function ChartCardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function SectionCardHeader({
  title,
  to,
  cta,
}: {
  title: string;
  to?: string;
  cta?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {to && cta ? (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
        >
          {cta}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export function OverviewPage() {
  const [range, setRange] = useState<'7' | '30' | '90'>('30');

  const { data: kpis, loading: loadingKpis } = useAsync(() => api.kpis(), []);
  const { data: revenue, loading: loadingRevenue } = useAsync(
    () => api.revenue(),
    [],
  );
  const { data: userGrowthRaw, loading: loadingGrowth } = useAsync(
    () => api.userGrowth(),
    [],
  );
  const { data: planDistRaw, loading: loadingPlans } = useAsync(
    () => api.planDistribution(),
    [],
  );
  const { data: health, loading: loadingHealth } = useAsync(
    () => api.systemHealth(),
    [],
  );
  const { data: recent, loading: loadingRecent } = useAsync(
    () => api.recent(),
    [],
  );

  const loading =
    loadingKpis ||
    loadingRevenue ||
    loadingGrowth ||
    loadingPlans ||
    loadingHealth ||
    loadingRecent;

  // Revenue & new users (6 tháng) — map newUsers → users cho chart.
  const revenueMonthly = ((revenue ?? []) as any[]).map((r) => ({
    month: r.month as string,
    revenue: r.revenue as number,
    users: r.newUsers as number,
  }));

  // Tăng trưởng người dùng tích lũy.
  const userGrowth = (userGrowthRaw ?? []) as { month: string; total: number }[];

  // Phân bổ gói — map { plan, count } → { name, value, color }.
  const planDistribution = ((planDistRaw ?? []) as any[]).map((p) => ({
    name: p.plan as string,
    value: p.count as number,
    color: TONES[planTone[(p.plan as PlanName)] ?? 'slate'].hex,
  }));
  const totalPlanSubs = planDistribution.reduce((s, p) => s + p.value, 0);

  // Tình trạng hệ thống — { services:[{name,ok}] } → { name, status, uptime }.
  const systemHealth = ((health?.services ?? []) as any[]).map((s) => ({
    name: s.name as string,
    status: (s.ok ? 'operational' : 'down') as string,
    uptime: s.ok ? '99.9%' : '—',
  }));

  // Người dùng mới gần đây.
  const newUsers: {
    id: string;
    name: string;
    email: string;
    plan: PlanName;
    initials: string;
    tone: Tone;
  }[] = ((recent?.users ?? []) as any[]).map((u) => ({
    id: u.id as string,
    name: u.name as string,
    email: u.email as string,
    plan: u.plan as PlanName,
    initials: initialsOf(u.name),
    tone: toneOf(u.id ?? u.email),
  }));

  // Giao dịch gần đây.
  const recentTx: {
    id: string;
    userName: string;
    userInitials: string;
    userTone: Tone;
    plan: string;
    amount: number;
    status: string;
  }[] = ((recent?.transactions ?? []) as any[]).map((t) => ({
    id: t.id as string,
    userName: t.owner?.name as string,
    userInitials: initialsOf(t.owner?.name),
    userTone: toneOf(t.owner?.id ?? t.owner?.email),
    plan: (t.planKey ?? t.plan) as string,
    amount: t.amount as number,
    status: t.status as string,
  }));

  const ranges: { id: '7' | '30' | '90'; label: string }[] = [
    { id: '7', label: '7 ngày' },
    { id: '30', label: '30 ngày' },
    { id: '90', label: '90 ngày' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan toàn hệ thống · cập nhật 28/06/2026"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <Calendar className="ml-2 h-3.5 w-3.5 text-slate-400" />
              {ranges.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    range === r.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button variant="primary" size="md">
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        }
      />

      {/* KPI grid */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Users}
            label="Tổng người dùng"
            value={formatNumber(kpis?.totalUsers ?? 0)}
            trend={12}
            tone="indigo"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Wallet}
            label="Doanh thu tháng"
            value={((kpis?.mrr ?? 0) / 1e9).toFixed(2) + ' tỷ'}
            suffix="đ"
            trend={8}
            tone="emerald"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Activity}
            label="Người dùng hoạt động"
            value={formatNumber(kpis?.activeSubscriptions ?? 0)}
            trend={5}
            tone="blue"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Sparkles}
            label="Lượt AI / tháng"
            value={((kpis?.aiUsage30d ?? 0) / 1e6).toFixed(2) + 'M'}
            trend={18}
            tone="violet"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={HardDrive}
            label="Dung lượng"
            value={((kpis?.totalStorageUsed ?? 0) / 1024 ** 4).toFixed(1)}
            suffix="TB"
            tone="amber"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={TrendingDown}
            label="Tỉ lệ rời bỏ"
            value={(kpis?.churnRate ?? 0) + '%'}
            trend={-0.3}
            tone="rose"
          />
        </motion.div>
        <motion.div variants={fadeUp} className="col-span-2">
          <Link to="/users" className="block h-full">
            <GlassCard
              interactive
              className="flex h-full items-center justify-between gap-4 p-5"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                    tone('emerald').soft,
                  )}
                >
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Người dùng mới hôm nay
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                    {formatNumber(kpis?.newUsers30d ?? 0)}
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-1 text-xs font-semibold text-indigo-600 sm:flex">
                Quản lý người dùng
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </GlassCard>
          </Link>
        </motion.div>
      </motion.div>

      {/* Charts row */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <motion.div variants={fadeUpLg} className="lg:col-span-2">
          <GlassCard className="h-full p-5">
            <ChartCardHeader
              title="Doanh thu & Người dùng mới"
              subtitle="6 tháng gần nhất · triệu VND / nghìn người dùng"
              right={
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                    Doanh thu
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Người dùng
                  </span>
                </div>
              }
            />
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={revenueMonthly}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={CHART_AXIS}
                  tick={{ fontSize: 12, fill: CHART_AXIS }}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                />
                <YAxis
                  yAxisId="left"
                  stroke={CHART_AXIS}
                  tick={{ fontSize: 12, fill: CHART_AXIS }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={CHART_AXIS}
                  tick={{ fontSize: 12, fill: CHART_AXIS }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  name="Doanh thu (triệu)"
                  fill={TONES['indigo'].hex}
                  radius={[6, 6, 0, 0]}
                  barSize={26}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="users"
                  name="Người dùng mới"
                  stroke={TONES['emerald'].hex}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: TONES['emerald'].hex }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUpLg}>
          <GlassCard className="flex h-full flex-col p-5">
            <ChartCardHeader
              title="Phân bổ gói"
              subtitle="Theo số người đăng ký"
            />
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {planDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">
                  {formatNumber(totalPlanSubs)}
                </span>
                <span className="text-xs text-slate-400">người dùng</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {planDistribution.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(p.value)}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      ({totalPlanSubs ? Math.round((p.value / totalPlanSubs) * 100) : 0}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* User growth wide chart */}
      <motion.div variants={fadeUpLg} initial="hidden" animate="show">
        <GlassCard className="p-5">
          <ChartCardHeader
            title="Tăng trưởng người dùng"
            subtitle="Tổng số người dùng tích lũy (nghìn)"
            right={
              <Badge tone="brand" dot>
                Đang tăng
              </Badge>
            }
          />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={userGrowth}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={TONES['indigo'].hex}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor={TONES['indigo'].hex}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="month"
                stroke={CHART_AXIS}
                tick={{ fontSize: 12, fill: CHART_AXIS }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
              />
              <YAxis
                stroke={CHART_AXIS}
                tick={{ fontSize: 12, fill: CHART_AXIS }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ stroke: TONES['indigo'].hex, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Tổng người dùng (nghìn)"
                stroke={TONES['indigo'].hex}
                strokeWidth={2.5}
                fill="url(#growthFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>

      {/* Bottom 3-col */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {/* System health */}
        <motion.div variants={fadeUp}>
          <GlassCard className="h-full p-5">
            <SectionCardHeader title="Tình trạng hệ thống" />
            <div className="space-y-1">
              {systemHealth.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-400">
                  Chưa có dữ liệu dịch vụ.
                </p>
              ) : (
                systemHealth.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-full',
                          s.status === 'operational'
                            ? 'bg-emerald-500'
                            : s.status === 'degraded'
                              ? 'bg-amber-500'
                              : 'bg-rose-500',
                        )}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{s.uptime}</span>
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* New users */}
        <motion.div variants={fadeUp}>
          <GlassCard className="h-full p-5">
            <SectionCardHeader title="Người dùng mới" to="/users" cta="Tất cả" />
            <div className="space-y-1">
              {newUsers.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-400">
                  Chưa có người dùng mới.
                </p>
              ) : (
                newUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar initials={u.initials} tone={u.tone} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {u.name}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <Badge tone={planBadge(u.plan)}>{u.plan}</Badge>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent transactions */}
        <motion.div variants={fadeUp}>
          <GlassCard className="h-full p-5">
            <SectionCardHeader
              title="Giao dịch gần đây"
              to="/billing"
              cta="Tất cả"
            />
            <div className="space-y-1">
              {recentTx.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-400">
                  Chưa có giao dịch.
                </p>
              ) : (
                recentTx.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        initials={t.userInitials}
                        tone={t.userTone}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {t.userName}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {formatNumber(t.amount)}đ · {t.plan}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Moderation callout strip */}
      <motion.div variants={fadeIn} initial="hidden" animate="show">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {formatNumber(health?.counts?.files ?? 0)} tệp đang chờ kiểm duyệt
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                Có nội dung bị gắn cờ hoặc đang chờ xem xét trong hàng đợi kiểm
                duyệt.
              </p>
            </div>
          </div>
          <Link to="/content" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              Xem hàng đợi
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Fake pagination footer style note kept consistent with table recipe */}
      <div className="flex items-center justify-between gap-3 px-1 text-xs text-slate-400">
        <span>Dữ liệu tổng hợp từ tất cả khu vực · múi giờ GMT+7</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
