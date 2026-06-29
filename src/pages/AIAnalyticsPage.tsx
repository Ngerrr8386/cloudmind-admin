import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Coins,
  Gauge,
  Target,
  Calendar,
  ChevronDown,
  TrendingUp,
  Search,
  Sparkles,
  Cpu,
  Layers,
  ShieldCheck,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Badge, GlassCard, AIChip, ConfidenceMeter } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { tone, TONES, TONE_ORDER, type Tone } from '@/lib/theme';
import { cn, formatNumber } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg } from '@/lib/motion';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';

type DateRange = '7 ngày' | '30 ngày' | '90 ngày';

interface FeatureBreakdown {
  feature: string;
  value: number;
  color: string;
}

const FEATURE_TONES: Tone[] = ['violet', 'indigo', 'blue', 'emerald', 'amber', 'rose'];

function chartTooltip() {
  return {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    color: '#0f172a',
    boxShadow: '0 8px 24px -12px rgba(16,24,40,0.2)',
  } as const;
}

function DateRangePill({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const ranges: DateRange[] = ['7 ngày', '30 ngày', '90 ngày'];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <Calendar className="h-4 w-4 text-slate-400" />
        <span>{value}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card"
        >
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                r === value
                  ? 'bg-indigo-50 font-semibold text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {r}
              {r === value && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function FeatureCard({
  item,
  total,
  toneKey,
}: {
  item: FeatureBreakdown;
  total: number;
  toneKey: Tone;
}) {
  const pct = total > 0 ? (item.value / total) * 100 : 0;
  return (
    <motion.div variants={fadeUp}>
      <GlassCard interactive className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl',
              tone(toneKey).soft,
            )}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <Badge tone="neutral">{pct.toFixed(1)}%</Badge>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-900">{item.feature}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {formatNumber(item.value)}
          <span className="ml-1 text-sm font-medium text-slate-400">k lượt</span>
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: item.color }}
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}

interface AiMetrics {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatencyMs: number;
  estimatedCost: number;
}
interface AiByFeature {
  feature: string;
  calls: number;
  tokens: number;
}
interface AiDailyPoint {
  date: string;
  calls: number;
}
interface AiTopQuery {
  query: string;
  count: number;
}

function Spinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
    </div>
  );
}

export function AIAnalyticsPage() {
  const [range, setRange] = useState<DateRange>('7 ngày');

  const { data: metrics } = useAsync(() => api.aiMetrics() as Promise<AiMetrics>, []);
  const { data: byFeature, loading: loadingFeature } = useAsync(
    () => api.aiByFeature() as Promise<AiByFeature[]>,
    [],
  );
  const { data: dailyTrend, loading: loadingTrend } = useAsync(
    () => api.aiDailyTrend() as Promise<AiDailyPoint[]>,
    [],
  );
  const { data: queries, loading: loadingQueries } = useAsync(
    () => api.aiTopQueries() as Promise<AiTopQuery[]>,
    [],
  );

  const featureData: FeatureBreakdown[] = (byFeature ?? []).map((f, i) => ({
    feature: f.feature,
    value: f.calls,
    color: TONES[TONE_ORDER[i % TONE_ORDER.length]].hex,
  }));
  const totalFeatureValue = featureData.reduce((acc, f) => acc + f.value, 0);

  const trendData = (dailyTrend ?? []).map((p) => ({ day: p.date, calls: p.calls }));

  const topQueries = queries ?? [];
  const maxQueryCount = topQueries.length ? Math.max(...topQueries.map((q) => q.count)) : 0;

  const modelChips = [
    { label: 'Mô hình', value: 'CloudMind AI v2', icon: Cpu, toneKey: 'violet' as Tone },
    { label: 'Cửa sổ ngữ cảnh', value: '200K tokens', icon: Layers, toneKey: 'indigo' as Tone },
    {
      label: 'Độ trễ p95',
      value: metrics ? (metrics.avgLatencyMs / 1000).toFixed(1) + 's' : '—',
      icon: Gauge,
      toneKey: 'blue' as Tone,
    },
    { label: 'Bảo mật', value: 'Mã hóa AES-256', icon: ShieldCheck, toneKey: 'emerald' as Tone },
  ];

  const planLimits = [
    { plan: 'Free', limit: '50 lượt / tháng', toneKey: 'slate' as Tone },
    { plan: 'Pro', limit: '5.000 lượt / tháng', toneKey: 'indigo' as Tone },
    { plan: 'Team', limit: 'Không giới hạn', toneKey: 'violet' as Tone },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<Badge tone="ai">AI</Badge>}
        title="Phân tích AI"
        subtitle="Mức sử dụng, chi phí và hiệu năng của các tính năng AI"
        actions={<DateRangePill value={range} onChange={setRange} />}
      />

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Brain}
            label="Lượt AI / tháng"
            value={metrics ? (metrics.totalCalls / 1e6).toFixed(2) + 'M' : '—'}
            trend={18}
            tone="violet"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Coins}
            label="Chi phí mô hình"
            value={metrics ? formatNumber(Math.round(metrics.estimatedCost)) + ' đ' : '—'}
            tone="amber"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Gauge}
            label="Độ trễ trung bình"
            value={metrics ? Math.round(metrics.avgLatencyMs) + 'ms' : '—'}
            tone="blue"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard icon={Target} label="Độ chính xác" value="98.7%" tone="emerald" />
        </motion.div>
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div variants={fadeUpLg} initial="hidden" animate="show">
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Lượt dùng theo tính năng</h3>
                <p className="mt-0.5 text-sm text-slate-500">Đơn vị: nghìn lượt</p>
              </div>
              <AIChip label="Realtime" />
            </div>
            {loadingFeature ? (
              <Spinner />
            ) : featureData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                Chưa có dữ liệu tính năng
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={featureData}
                margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke="#eef2f7" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={110}
                  stroke="#94a3b8"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={chartTooltip()}
                  cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                  formatter={(v: number) => [formatNumber(v) + 'k lượt', 'Lượt dùng']}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                  {featureData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUpLg} initial="hidden" animate="show">
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Xu hướng lượt AI 7 ngày</h3>
                <p className="mt-0.5 text-sm text-slate-500">Đơn vị: nghìn lượt / ngày</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                +18%
              </span>
            </div>
            {loadingTrend ? (
              <Spinner />
            ) : trendData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                Chưa có dữ liệu xu hướng
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="aiTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TONES.indigo.hex} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={TONES.indigo.hex} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="day"
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
                  contentStyle={chartTooltip()}
                  cursor={{ stroke: '#c7d2fe', strokeWidth: 1 }}
                  formatter={(v: number) => [formatNumber(v) + 'k lượt', 'Lượt AI']}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke={TONES.indigo.hex}
                  strokeWidth={2.5}
                  fill="url(#aiTrendFill)"
                  dot={{ r: 3, fill: TONES.indigo.hex, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Top queries + model config */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div variants={fadeUpLg} initial="hidden" animate="show" className="xl:col-span-2">
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Truy vấn phổ biến</h3>
                  <p className="mt-0.5 text-sm text-slate-500">Theo số lượt gọi AI</p>
                </div>
              </div>
              <Badge tone="neutral">{formatNumber(topQueries.length)} truy vấn</Badge>
            </div>
            {loadingQueries ? (
              <Spinner />
            ) : topQueries.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                Chưa có truy vấn nào
              </div>
            ) : (
            <motion.ul
              variants={staggerContainer(0.05)}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {topQueries.map((q, i) => {
                const widthPct = maxQueryCount > 0 ? (q.count / maxQueryCount) * 100 : 0;
                return (
                  <motion.li
                    key={q.query}
                    variants={fadeUp}
                    className="group rounded-2xl border border-slate-100 p-3.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                        {i + 1}
                      </span>
                      <p className="flex-1 truncate text-sm font-medium text-slate-700">
                        {q.query}
                      </p>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                        {formatNumber(q.count)}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.04 }}
                        className="h-full rounded-full bg-indigo-500"
                      />
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUpLg} initial="hidden" animate="show">
          <GlassCard className="flex h-full flex-col p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Cấu hình mô hình</h3>
                <p className="mt-0.5 text-sm text-slate-500">Chỉ đọc</p>
              </div>
            </div>

            <div className="space-y-3">
              {modelChips.map((chip) => {
                const Icon = chip.icon;
                return (
                  <div
                    key={chip.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-3.5 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-xl',
                          tone(chip.toneKey).soft,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-slate-500">{chip.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{chip.value}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Database className="h-3.5 w-3.5" />
                Hạn mức theo gói
              </div>
              <div className="space-y-2">
                {planLimits.map((p) => (
                  <div key={p.plan} className="flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
                        tone(p.toneKey).soft,
                      )}
                    >
                      {p.plan}
                    </span>
                    <span className="text-sm font-medium text-slate-600">{p.limit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Độ tin cậy mô hình</span>
                <span className="text-sm font-bold text-slate-900">98.7%</span>
              </div>
              <ConfidenceMeter value={98.7} />
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Feature breakdown grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Chi tiết theo tính năng</h3>
          <span className="text-sm text-slate-500">
            Tổng: {formatNumber(totalFeatureValue)}k lượt
          </span>
        </div>
        {loadingFeature ? (
          <Spinner />
        ) : featureData.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-slate-400">
            Chưa có dữ liệu tính năng
          </GlassCard>
        ) : (
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {featureData.map((item, i) => (
              <FeatureCard
                key={item.feature}
                item={item}
                total={totalFeatureValue}
                toneKey={FEATURE_TONES[i % FEATURE_TONES.length]}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}