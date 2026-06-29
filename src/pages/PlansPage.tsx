import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Check,
  Pencil,
  Users,
  TrendingUp,
  Wallet,
  PieChart as PieChartIcon,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { Button, Badge, GlassCard, Toggle, ProgressBar } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { tone, TONES, type Tone } from '@/lib/theme';
import { cn, formatNumber } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg } from '@/lib/motion';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { toneOf } from '@/lib/adminMap';
import type { AdminPlan } from '@/lib/types';

interface ApiPlan {
  id: string;
  key: string;
  name: string;
  priceMonthly: number;
  storageBytes: number;
  features: string[];
  active: boolean;
  subscribers: number;
  mrr: number;
}

const GiB = 1024 ** 3;
const TiB = 1024 ** 4;

function storageLabel(bytes: number): string {
  return bytes / GiB >= 1024 ? bytes / TiB + ' TB' : bytes / GiB + ' GB';
}

function toAdminPlan(p: ApiPlan): AdminPlan {
  return {
    id: p.id,
    name: p.name as AdminPlan['name'],
    priceMonthly: p.priceMonthly,
    tone: toneOf(p.key),
    subscribers: p.subscribers,
    mrr: p.mrr,
    storage: storageLabel(p.storageBytes),
    active: p.active,
    features: p.features ?? [],
  };
}

interface PerfDatum {
  name: string;
  subscribers: number;
  mrr: number;
  color: string;
}

interface PlanCardProps {
  plan: AdminPlan;
  totalSubscribers: number;
  totalUsers: number;
  onToggle: () => void;
}

function formatTy(value: number): string {
  return (value / 1e9).toFixed(2) + ' tỷ đ';
}

function PlanCard({ plan, totalSubscribers, totalUsers, onToggle }: PlanCardProps) {
  const [enabled, setEnabled] = useState<boolean>(plan.active);
  const [toggling, setToggling] = useState(false);
  const isPro = plan.name === 'Pro';

  async function handleToggle(next: boolean) {
    if (toggling) return;
    setEnabled(next); // optimistic
    setToggling(true);
    try {
      await api.togglePlan(plan.id);
      onToggle();
    } catch {
      setEnabled(!next); // revert on error
    } finally {
      setToggling(false);
    }
  }
  const accent = isPro ? 'indigo' : plan.tone;
  const subscriberShare = totalSubscribers > 0 ? (plan.subscribers / totalSubscribers) * 100 : 0;
  const userShare = totalUsers > 0 ? (plan.subscribers / totalUsers) * 100 : 0;

  return (
    <motion.div variants={fadeUpLg} className="h-full">
      <GlassCard
        glow={isPro}
        className={cn(
          'relative flex h-full flex-col p-6',
          isPro && 'ring-2 ring-indigo-200',
        )}
      >
        {isPro && (
          <div className="absolute -top-3 right-6">
            <Badge tone="brand" className="shadow-sm">
              <Sparkles className="mr-1 h-3 w-3" />
              Phổ biến
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold',
                  tone(accent).soft,
                )}
              >
                {plan.name.charAt(0)}
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {plan.priceMonthly === 0 ? (
                'Miễn phí'
              ) : (
                <>
                  {formatNumber(plan.priceMonthly)}đ
                  <span className="text-sm font-medium text-slate-400">/tháng</span>
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-slate-500">{plan.storage} dung lượng</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-medium text-slate-400">
              {enabled ? 'Đang bật' : 'Đã tắt'}
            </span>
            <Toggle checked={enabled} onChange={handleToggle} />
          </div>
        </div>

        <div className="my-5 h-px w-full bg-slate-100" />

        {/* Stats */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Người đăng ký</span>
              <span className="font-semibold text-slate-900">
                {formatNumber(plan.subscribers)}
              </span>
            </div>
            <ProgressBar
              progress={subscriberShare}
              gradient={cn(tone(accent).solid)}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-slate-400">
              {subscriberShare.toFixed(1)}% tổng người đăng ký
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">MRR</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatTy(plan.mrr)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">% tổng người dùng</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {userShare.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <ul className="mt-5 flex-1 space-y-2.5">
          {plan.features.map((feature: string) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span
                className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                  tone(accent).soft,
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-2">
          <Button
            variant={isPro ? 'primary' : 'outline'}
            size="sm"
            className="flex-1"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Chỉnh sửa
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Xem người đăng ký
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function PlansPage() {
  const { data: rawPlans, loading, reload } = useAsync(() => api.plans(), []);
  const { data: kpis } = useAsync(() => api.kpis(), []);

  const adminPlans: AdminPlan[] = ((rawPlans as ApiPlan[] | null) ?? []).map(
    toAdminPlan,
  );
  const totalUsers = (kpis as { totalUsers?: number } | null)?.totalUsers ?? 0;

  const totalSubscribers = adminPlans.reduce(
    (sum: number, p: AdminPlan) => sum + p.subscribers,
    0,
  );
  const totalMrr = adminPlans.reduce((sum: number, p: AdminPlan) => sum + p.mrr, 0);
  const paidSubscribers = adminPlans
    .filter((p: AdminPlan) => p.name === 'Pro' || p.name === 'Team')
    .reduce((sum: number, p: AdminPlan) => sum + p.subscribers, 0);
  const arpu = paidSubscribers > 0 ? Math.round(totalMrr / paidSubscribers) : 0;

  const perfData: PerfDatum[] = adminPlans.map((p: AdminPlan) => ({
    name: p.name,
    subscribers: p.subscribers,
    mrr: p.mrr,
    color: tone(p.name === 'Pro' ? 'indigo' : p.tone).hex,
  }));

  // Conversion: free -> paid
  const freeSubs =
    adminPlans.find((p: AdminPlan) => p.name === 'Free')?.subscribers ?? 0;
  const conversionRate =
    totalSubscribers > 0 ? (paidSubscribers / totalSubscribers) * 100 : 0;

  const totalPlans = adminPlans.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gói cước"
        subtitle="Quản lý các gói & theo dõi hiệu suất"
        actions={
          <Button variant="primary" size="md">
            <Plus className="mr-1.5 h-4 w-4" />
            Tạo gói mới
          </Button>
        }
      />

      {/* Stats */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Users}
            label="Tổng người đăng ký"
            value={formatNumber(totalSubscribers)}
            tone="indigo"
            trend={8.4}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Wallet}
            label="Tổng MRR"
            value={formatTy(totalMrr)}
            tone="emerald"
            trend={12.1}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={TrendingUp}
            label="ARPU"
            value={formatNumber(arpu) + 'đ'}
            tone="violet"
            trend={3.6}
          />
        </motion.div>
      </motion.div>

      {/* Plan cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : adminPlans.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <PieChartIcon className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Chưa có gói cước nào</p>
          <p className="text-xs text-slate-400">Tạo gói mới để bắt đầu quản lý.</p>
        </GlassCard>
      ) : (
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {adminPlans.map((plan: AdminPlan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              totalSubscribers={totalSubscribers}
              totalUsers={totalUsers}
              onToggle={reload}
            />
          ))}
        </motion.div>
      )}

      {/* Performance */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
      >
        {/* Chart */}
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Hiệu suất gói</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Số người đăng ký theo từng gói cước
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <PieChartIcon className="h-4 w-4" />
              </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={perfData}
                margin={{ top: 16, right: 8, left: -8, bottom: 0 }}
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
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    color: '#0f172a',
                    boxShadow: '0 8px 24px -12px rgba(16,24,40,0.2)',
                  }}
                  cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                  formatter={(value: number) => [
                    formatNumber(value) + ' người',
                    'Người đăng ký',
                  ]}
                />
                <Bar dataKey="subscribers" radius={[8, 8, 0, 0]} maxBarSize={88}>
                  {perfData.map((entry: PerfDatum) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="subscribers"
                    position="top"
                    formatter={(v: number) => formatNumber(v)}
                    style={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Conversion note + table */}
        <motion.div variants={fadeUp}>
          <GlassCard className="flex h-full flex-col p-6">
            <h3 className="text-base font-semibold text-slate-900">Tỷ lệ chuyển đổi</h3>
            <p className="mt-1 text-sm text-slate-500">Từ gói miễn phí sang trả phí</p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <p className="text-3xl font-bold text-indigo-600">
                {conversionRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatNumber(paidSubscribers)} / {formatNumber(totalSubscribers)} người
                đăng ký đang trả phí
              </p>
              <ProgressBar
                progress={conversionRate}
                gradient={TONES['indigo'].solid}
                className="mt-3"
              />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <span className="text-sm text-slate-500">Người dùng miễn phí</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatNumber(freeSubs)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <span className="text-sm text-slate-500">Người dùng trả phí</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatNumber(paidSubscribers)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <span className="text-sm text-slate-500">Số gói đang quản lý</span>
                <span className="text-sm font-semibold text-slate-900">{totalPlans}</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="mt-auto w-full justify-center">
              Xem báo cáo chi tiết
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Detail table */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200 shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Gói</th>
                <th className="px-5 py-3.5">Giá / tháng</th>
                <th className="px-5 py-3.5">Dung lượng</th>
                <th className="px-5 py-3.5">Người đăng ký</th>
                <th className="px-5 py-3.5">MRR</th>
                <th className="px-5 py-3.5">% tổng</th>
                <th className="px-5 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adminPlans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                    {loading ? 'Đang tải...' : 'Chưa có gói cước nào'}
                  </td>
                </tr>
              )}
              {adminPlans.map((plan: AdminPlan) => {
                const accent: Tone = plan.name === 'Pro' ? 'indigo' : plan.tone;
                const share =
                  totalSubscribers > 0
                    ? (plan.subscribers / totalSubscribers) * 100
                    : 0;
                return (
                  <tr key={plan.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-700">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold',
                            tone(accent).soft,
                          )}
                        >
                          {plan.name.charAt(0)}
                        </span>
                        <span className="font-medium text-slate-900">{plan.name}</span>
                        {plan.name === 'Pro' && (
                          <Badge tone="brand" className="text-[10px]">
                            Phổ biến
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {plan.priceMonthly === 0
                        ? 'Miễn phí'
                        : formatNumber(plan.priceMonthly) + 'đ'}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{plan.storage}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {formatNumber(plan.subscribers)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{formatTy(plan.mrr)}</td>
                    <td className="px-5 py-4 text-slate-700">{share.toFixed(1)}%</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          plan.active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            plan.active ? 'bg-emerald-500' : 'bg-slate-400',
                          )}
                        />
                        {plan.active ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 text-xs text-slate-400">
            <span>
              Hiển thị 1–{adminPlans.length} / tổng {adminPlans.length} gói
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-3.5 w-3.5" />
                Trước
              </Button>
              <Button variant="outline" size="sm" disabled>
                Sau
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}