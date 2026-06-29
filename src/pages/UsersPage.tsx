import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  Clock,
  ShieldOff,
  Search,
  Filter,
  Download,
  UserPlus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Avatar, Badge, Button, Input } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { initialsOf, toneOf } from '@/lib/adminMap';
import type { ManagedUser, PlanName } from '@/lib/types';
import { tone, type Tone } from '@/lib/theme';
import { cn, formatBytes, formatNumber, timeAgo } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg } from '@/lib/motion';

const PAGE_LIMIT = 10;

type PlanFilter = 'Tất cả' | PlanName;

const PLAN_FILTERS: PlanFilter[] = ['Tất cả', 'Free', 'Pro', 'Team'];

function mapUser(u: any): ManagedUser {
  const name: string = u?.name ?? '';
  const created: string = u?.createdAt ?? '';
  return {
    id: String(u?.id ?? ''),
    name,
    email: u?.email ?? '',
    initials: initialsOf(name),
    tone: toneOf(u?.id ?? u?.email),
    plan: (u?.plan ?? 'Free') as PlanName,
    status: u?.status ?? 'active',
    storageUsed: u?.storageUsed ?? 0,
    storageTotal: u?.storageTotal ?? 0,
    filesCount: 0,
    aiCalls: 0,
    joinedAt: created,
    lastActive: u?.lastActiveAt ?? created,
    country: '—',
  };
}

const PLAN_TONE: Record<PlanName, Tone> = {
  Free: 'slate',
  Pro: 'indigo',
  Team: 'violet',
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'trial', label: 'Dùng thử' },
  { value: 'suspended', label: 'Đã khóa' },
  { value: 'pending', label: 'Chờ duyệt' },
];

function PlanPill({ plan }: { plan: PlanName }) {
  const t = PLAN_TONE[plan];
  if (plan === 'Free') {
    return <span className="text-xs font-medium text-slate-500">{plan}</span>;
  }
  return (
    <Badge tone={t === 'indigo' ? 'brand' : 'ai'} className="text-[11px]">
      {plan}
    </Badge>
  );
}

function StorageCell({ user }: { user: ManagedUser }) {
  const pct =
    user.storageTotal > 0
      ? Math.min(100, Math.round((user.storageUsed / user.storageTotal) * 100))
      : 0;
  const near = pct >= 85;
  return (
    <div className="min-w-[140px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">
          {formatBytes(user.storageUsed)}
        </span>
        <span className={cn('text-[11px]', near ? 'text-rose-500' : 'text-slate-400')}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            near ? 'bg-rose-500' : 'bg-indigo-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('Tất cả');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: kpiData } = useAsync(() => api.kpis(), []);
  const kpis = {
    totalUsers: kpiData?.totalUsers ?? 0,
    activeUsers: kpiData?.activeSubscriptions ?? 0,
    newUsers30d: kpiData?.newUsers30d ?? 0,
  };

  const { data: usersData, loading } = useAsync(
    () =>
      api.users({
        page,
        limit: PAGE_LIMIT,
        q: query.trim() || undefined,
        plan: planFilter === 'Tất cả' ? undefined : planFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    [page, query, planFilter, statusFilter],
  );

  const filteredUsers = useMemo<ManagedUser[]>(
    () => (usersData?.items ?? []).map(mapUser),
    [usersData],
  );

  const total = usersData?.meta?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd = (page - 1) * PAGE_LIMIT + filteredUsers.length;
  const hasPrev = page > 1;
  const hasNext = rangeEnd < total;

  const trialCount = useMemo(
    () => filteredUsers.filter((u) => u.status === 'trial').length,
    [filteredUsers],
  );
  const suspendedCount = useMemo(
    () => filteredUsers.filter((u) => u.status === 'suspended').length,
    [filteredUsers],
  );

  const handleRowClick = (id: string) => {
    navigate('/users/' + id);
  };

  const handleMoreClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate('/users/' + id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng"
        subtitle={`${formatNumber(kpis.totalUsers)} người dùng · ${formatNumber(kpis.newUsers30d)} mới (30 ngày)`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="glass" size="md">
              <Download className="h-4 w-4" />
              Xuất CSV
            </Button>
            <Button variant="primary" size="md">
              <UserPlus className="h-4 w-4" />
              Thêm người dùng
            </Button>
          </div>
        }
      />

      {/* Mini stat cards */}
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
            value={formatNumber(kpis.totalUsers)}
            trend={6.4}
            tone="indigo"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={UserCheck}
            label="Đang hoạt động"
            value={formatNumber(kpis.activeUsers)}
            trend={3.1}
            tone="emerald"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Clock}
            label="Dùng thử"
            value={formatNumber(trialCount)}
            tone="amber"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={ShieldOff}
            label="Đã khóa"
            value={formatNumber(suspendedCount)}
            tone="rose"
          />
        </motion.div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        variants={fadeUpLg}
        initial="hidden"
        animate="show"
        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên hoặc email..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Plan chips */}
            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
              {PLAN_FILTERS.map((plan) => {
                const activeChip = planFilter === plan;
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => {
                      setPlanFilter(plan);
                      setPage(1);
                    }}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      activeChip
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {plan}
                  </button>
                );
              })}
            </div>

            {/* Status dropdown look */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-indigo-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <Button variant="outline" size="md">
              <Filter className="h-4 w-4" />
              Lọc
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-card">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <EmptyState
            icon={Users}
            title="Không tìm thấy người dùng"
            description="Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc gói dịch vụ."
            action={
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setQuery('');
                  setPlanFilter('Tất cả');
                  setStatusFilter('all');
                  setPage(1);
                }}
              >
                Xóa bộ lọc
              </Button>
            }
          />
        </div>
      ) : (
        <motion.div variants={fadeUpLg} initial="hidden" animate="show">
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-card">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Người dùng</th>
                  <th className="px-5 py-3.5">Gói</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Dung lượng</th>
                  <th className="px-5 py-3.5">Lượt AI</th>
                  <th className="px-5 py-3.5">Tham gia</th>
                  <th className="px-5 py-3.5">Hoạt động</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleRowClick(u.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={u.initials} tone={u.tone} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900">
                            {u.name}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <PlanPill plan={u.plan} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-4">
                      <StorageCell user={u} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-700">
                        {formatNumber(u.aiCalls)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {timeAgo(u.lastActive)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleMoreClick(e, u.id)}
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors',
                          'hover:bg-slate-100 hover:text-slate-600',
                        )}
                        aria-label="Tùy chọn"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination footer */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 sm:flex-row">
              <p className="text-xs text-slate-400">
                Hiển thị{' '}
                <span className="font-medium text-slate-600">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                / tổng{' '}
                <span className="font-medium text-slate-600">
                  {formatNumber(total)}
                </span>{' '}
                người dùng
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <span className={cn('rounded-lg px-3 py-1 text-xs font-medium', tone('indigo').soft)}>
                  {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}