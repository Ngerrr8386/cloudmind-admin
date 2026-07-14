import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Download,
  Search,
  ShieldAlert,
  Info,
  ChevronDown,
  Server,
} from 'lucide-react';
import { Button, GlassCard, Avatar } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { initialsOf, toneOf } from '@/lib/adminMap';
import type { AuditEntry, Severity } from '@/lib/types';
import { cn, timeAgo, formatNumber } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg } from '@/lib/motion';

type SeverityFilter = 'all' | 'info' | 'warning' | 'critical';

interface SeverityMeta {
  key: SeverityFilter;
  label: string;
  dot: string;
  iconBg: string;
  iconText: string;
  line: string;
  icon: typeof Info;
}

const SEVERITY_META: Record<'info' | 'warning' | 'critical', SeverityMeta> = {
  info: {
    key: 'info',
    label: 'Thông tin',
    dot: 'bg-slate-400',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-500',
    line: 'ring-slate-200',
    icon: Info,
  },
  warning: {
    key: 'warning',
    label: 'Cảnh báo',
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    line: 'ring-amber-200',
    icon: AlertTriangle,
  },
  critical: {
    key: 'critical',
    label: 'Nghiêm trọng',
    dot: 'bg-rose-500',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    line: 'ring-rose-200',
    icon: ShieldAlert,
  },
};

const FILTERS: { key: SeverityFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'info', label: 'Thông tin' },
  { key: 'warning', label: 'Cảnh báo' },
  { key: 'critical', label: 'Nghiêm trọng' },
];

function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm theo người, thao tác, IP…"
        className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

interface TimelineRowProps {
  entry: AuditEntry;
  isLast: boolean;
}

function TimelineRow({ entry, isLast }: TimelineRowProps) {
  const meta = SEVERITY_META[entry.severity];
  const Icon = meta.icon;

  return (
    <motion.li variants={fadeUp} className="relative flex gap-4 pb-7 last:pb-0">
      {/* Connecting line */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[1.375rem] top-12 bottom-0 w-px bg-slate-200"
        />
      )}

      {/* Severity indicator */}
      <div
        className={cn(
          'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-4 ring-white',
          meta.iconBg,
        )}
      >
        <Icon className={cn('h-5 w-5', meta.iconText)} />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
            meta.dot,
          )}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-colors hover:bg-slate-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar initials={entry.actorInitials} tone={entry.actorTone} size="sm" />
            <div className="min-w-0">
              <p className="text-sm leading-snug text-slate-500">
                <span className="font-semibold text-slate-800">{entry.actor}</span>{' '}
                <span className="font-medium text-slate-700">{entry.action}</span>{' '}
                <span className="text-slate-500">{entry.target}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 font-mono text-slate-400">
                  <Server className="h-3 w-3" />
                  {entry.ip}
                </span>
                <span className="text-slate-300">•</span>
                <span>{timeAgo(entry.timestamp)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={entry.severity} />
          </div>
        </div>
      </div>
    </motion.li>
  );
}

function toEntry(item: any): AuditEntry {
  const actorName = item?.actorName ?? '—';
  return {
    id: String(item?.id ?? ''),
    actor: actorName,
    actorInitials: initialsOf(actorName),
    actorTone: toneOf(actorName),
    action: item?.action ?? '',
    target: item?.target ?? '',
    severity: (item?.severity ?? 'info') as Severity,
    ip: item?.ip ?? '—',
    timestamp: item?.createdAt ?? '',
  };
}

const PAGE_SIZE = 50;

export function AuditLogPage() {
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Đổi bộ lọc / từ khoá → quay về trang đầu.
  function changeFilter(next: SeverityFilter) {
    setFilter(next);
    setLimit(PAGE_SIZE);
  }
  function changeQuery(next: string) {
    setQuery(next);
    setLimit(PAGE_SIZE);
  }

  const { data, loading } = useAsync(
    () =>
      api.audit({
        severity: filter === 'all' ? undefined : filter,
        q: query || undefined,
        page: 1,
        limit,
      }),
    [filter, query, limit],
  );

  const filtered = useMemo<AuditEntry[]>(
    () => (data?.items ?? []).map(toEntry),
    [data],
  );

  const totalEntries = (data?.meta?.total as number | undefined) ?? filtered.length;
  // Còn dữ liệu để tải thêm khi đã nhận đủ 1 trang và tổng vẫn lớn hơn số đang hiển thị.
  const hasMore = filtered.length >= limit && filtered.length < totalEntries;

  const warningCount = useMemo(
    () => filtered.filter((e) => e.severity === 'warning').length,
    [filtered],
  );
  const criticalCount = useMemo(
    () => filtered.filter((e) => e.severity === 'critical').length,
    [filtered],
  );

  const counts = useMemo(
    () => ({
      all: filtered.length,
      info: filtered.filter((e) => e.severity === 'info').length,
      warning: warningCount,
      critical: criticalCount,
    }),
    [filtered, warningCount, criticalCount],
  );

  async function handleExport() {
    try {
      const payload = await api.auditExport();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* lỗi xuất: bỏ qua, không crash trang */
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nhật ký hệ thống"
        subtitle="Mọi thao tác quản trị & sự kiện hệ thống đều được ghi lại"
        actions={
          <div className="flex items-center gap-3">
            <SearchField value={query} onChange={changeQuery} />
            <Button variant="glass" size="md" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Xuất nhật ký
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <motion.div variants={fadeUpLg}>
          <StatCard
            icon={Activity}
            label="Tổng sự kiện"
            value={formatNumber(totalEntries)}
            tone="indigo"
          />
        </motion.div>
        <motion.div variants={fadeUpLg}>
          <StatCard
            icon={AlertTriangle}
            label="Cảnh báo"
            value={formatNumber(warningCount)}
            tone="amber"
          />
        </motion.div>
        <motion.div variants={fadeUpLg}>
          <StatCard
            icon={ShieldAlert}
            label="Nghiêm trọng"
            value={formatNumber(criticalCount)}
            tone="rose"
          />
        </motion.div>
      </motion.div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => changeFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
              )}
            >
              {f.key !== 'all' && (
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    SEVERITY_META[f.key].dot,
                  )}
                />
              )}
              {f.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-400',
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <GlassCard className="p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Dòng thời gian sự kiện</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Hiển thị {formatNumber(filtered.length)} mục, mới nhất xếp trước
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Info}
            title="Không có sự kiện nào"
            description="Không tìm thấy mục nhật ký nào khớp với bộ lọc hiện tại."
            action={
              <Button variant="secondary" size="sm" onClick={() => changeFilter('all')}>
                Xóa bộ lọc
              </Button>
            }
          />
        ) : (
          <motion.ul
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="show"
            className="relative"
          >
            {filtered.map((entry, i) => (
              <TimelineRow
                key={entry.id}
                entry={entry}
                isLast={i === filtered.length - 1}
              />
            ))}
          </motion.ul>
        )}

        {filtered.length > 0 && hasMore && (
          <div className="mt-2 flex justify-center border-t border-slate-100 pt-6">
            <Button
              variant="secondary"
              size="md"
              disabled={loading}
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
            >
              <ChevronDown className="h-4 w-4" />
              Tải thêm
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}