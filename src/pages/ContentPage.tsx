import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileWarning,
  Clock,
  Trash2,
  Flag,
  SlidersHorizontal,
  ShieldCheck,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Badge,
  GlassCard,
  Avatar,
  Input,
  FileTypeIcon,
  fileTypeLabel,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { initialsOf, toneOf } from '@/lib/adminMap';
import { cn, formatBytes, timeAgo, formatNumber } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg } from '@/lib/motion';
import type { ContentItem } from '@/lib/types';

type StatusFilter = 'all' | 'flagged' | 'reviewing' | 'removed' | 'clean';

/** Map a backend content/file record → ContentItem cho render. */
function toContentItem(f: any): ContentItem {
  const ownerName = f?.owner?.name ?? '—';
  const seed = f?.owner?.id ?? f?.owner?.email ?? ownerName;
  return {
    id: String(f?.id ?? ''),
    fileName: f?.name ?? '',
    fileType: (f?.type ?? 'doc') as ContentItem['fileType'],
    ownerName,
    ownerInitials: initialsOf(ownerName),
    ownerTone: toneOf(seed),
    size: f?.size ?? 0,
    status: (f?.moderationStatus ?? 'clean') as ContentItem['status'],
    reason: f?.flagReason ?? undefined,
    reports: 0,
    uploadedAt: f?.createdAt ?? '',
  };
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'flagged', label: 'Gắn cờ' },
  { key: 'reviewing', label: 'Đang xét' },
  { key: 'removed', label: 'Đã gỡ' },
  { key: 'clean', label: 'Sạch' },
];

// Map content fileType -> valid FileTypeIcon type
function iconType(t: ContentItem['fileType']): 'pdf' | 'doc' | 'image' | 'video' | 'audio' | 'archive' {
  return t;
}

function QueueCard({
  item,
  onApprove,
  onRemove,
}: {
  item: ContentItem;
  onApprove: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const isFlagged = item.status === 'flagged';
  const reasonTone = isFlagged ? 'text-rose-600' : 'text-amber-600';
  const reasonBg = isFlagged ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100';

  return (
    <motion.div variants={fadeUp}>
      <GlassCard interactive className="flex h-full flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 border border-slate-200">
            <FileTypeIcon type={iconType(item.fileType)} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900" title={item.fileName}>
              {item.fileName}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span>{fileTypeLabel[item.fileType]}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{formatBytes(item.size)}</span>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Avatar initials={item.ownerInitials} tone={item.ownerTone} size="xs" />
          <span className="truncate text-xs text-slate-600">{item.ownerName}</span>
        </div>

        {item.reason && (
          <div className={cn('mt-3 flex items-start gap-2 rounded-xl border px-3 py-2', reasonBg)}>
            <AlertTriangle className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', reasonTone)} />
            <span className={cn('text-xs font-medium leading-snug', reasonTone)}>{item.reason}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <Badge tone={item.reports > 0 ? 'candy' : 'neutral'} dot>
            {formatNumber(item.reports)} báo cáo
          </Badge>
          <span className="text-xs text-slate-400">{timeAgo(item.uploadedAt)}</span>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onApprove(item.id)}
          >
            <Check className="h-4 w-4" />
            Duyệt
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => onRemove(item.id)}>
            <Trash2 className="h-4 w-4" />
            Gỡ
          </Button>
          <Button variant="ghost" size="icon" aria-label="Xem chi tiết">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function ContentPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');

  const { data, loading, reload } = useAsync(() => api.content(), []);

  const contentItems = useMemo<ContentItem[]>(
    () => (data?.items ?? []).map(toContentItem),
    [data],
  );

  const pendingItems = useMemo(
    () => contentItems.filter((i) => i.status === 'flagged' || i.status === 'reviewing'),
    [contentItems],
  );

  const stats = useMemo(() => {
    const pending = contentItems.filter((i) => i.status === 'flagged' || i.status === 'reviewing').length;
    const removed = contentItems.filter((i) => i.status === 'removed').length;
    const reports = contentItems.reduce((sum, i) => sum + i.reports, 0);
    return { pending, removed, reports };
  }, [contentItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contentItems.filter((i) => {
      const matchStatus = filter === 'all' ? true : i.status === filter;
      const matchQuery =
        q === '' ||
        i.fileName.toLowerCase().includes(q) ||
        i.ownerName.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [filter, query, contentItems]);

  const filterCount = (key: StatusFilter) =>
    key === 'all' ? contentItems.length : contentItems.filter((i) => i.status === key).length;

  const handleApprove = async (id: string) => {
    try {
      await api.approveContent(id);
    } finally {
      reload();
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.removeContent(id);
    } finally {
      reload();
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nội dung & Kiểm duyệt"
        subtitle="Quản lý & kiểm duyệt file toàn hệ thống"
        actions={
          <Button variant="secondary" size="md">
            <SlidersHorizontal className="h-4 w-4" />
            Cấu hình bộ lọc
          </Button>
        }
      />

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <StatCard icon={FileWarning} label="Tổng file" value="8.4M" tone="amber" trend={6.4} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Clock}
            label="Đang chờ duyệt"
            value={formatNumber(stats.pending)}
            tone="blue"
            suffix="mục"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Trash2}
            label="Đã gỡ"
            value={formatNumber(stats.removed)}
            tone="rose"
            suffix="mục"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            icon={Flag}
            label="Tổng báo cáo"
            value={formatNumber(stats.reports)}
            tone="violet"
            trend={-3.1}
          />
        </motion.div>
      </motion.div>

      {/* Cần xử lý ngay */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">Cần xử lý ngay</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {formatNumber(pendingItems.length)} mục bị gắn cờ hoặc đang chờ kiểm duyệt
            </p>
          </div>
          <Badge tone="candy" dot>
            {formatNumber(pendingItems.length)} đang chờ
          </Badge>
        </div>

        {loading ? (
          <GlassCard className="grid place-items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </GlassCard>
        ) : pendingItems.length === 0 ? (
          <GlassCard className="p-2">
            <EmptyState
              icon={ShieldCheck}
              title="Không có mục nào cần xử lý"
              description="Toàn bộ nội dung đã được kiểm duyệt. Mọi thứ đều ổn."
            />
          </GlassCard>
        ) : (
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {pendingItems.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onRemove={handleRemove}
              />
            ))}
          </motion.div>
        )}
      </section>

      {/* Full table */}
      <motion.section variants={fadeUpLg} initial="hidden" animate="show" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Toàn bộ nội dung</h2>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách đầy đủ file trên hệ thống với trạng thái kiểm duyệt
            </p>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Tìm theo tên file hoặc chủ sở hữu..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {formatNumber(filterCount(f.key))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200 shadow-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">File</th>
                <th className="px-5 py-3.5">Chủ sở hữu</th>
                <th className="px-5 py-3.5">Kích thước</th>
                <th className="px-5 py-3.5">Báo cáo</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Tải lên</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12">
                    <div className="grid place-items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12">
                    <EmptyState
                      icon={Search}
                      title="Không tìm thấy nội dung"
                      description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 border border-slate-200">
                          <FileTypeIcon type={iconType(item.fileType)} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate font-medium text-slate-800" title={item.fileName}>
                            {item.fileName}
                          </p>
                          <p className="text-xs text-slate-400">{fileTypeLabel[item.fileType]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={item.ownerInitials} tone={item.ownerTone} size="sm" />
                        <span className="text-slate-700">{item.ownerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{formatBytes(item.size)}</td>
                    <td className="px-5 py-4">
                      {item.reports > 0 ? (
                        <span className="font-bold text-rose-600">{formatNumber(item.reports)}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">{timeAgo(item.uploadedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon" aria-label="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Duyệt"
                          className="text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleApprove(item.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Gỡ"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Fake pagination footer */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 text-xs text-slate-500 sm:flex-row">
            <span>
              Hiển thị <span className="font-semibold text-slate-700">1–{formatNumber(filtered.length)}</span> / tổng{' '}
              <span className="font-semibold text-slate-700">{formatNumber(contentItems.length)}</span> mục
            </span>
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
        </div>
      </motion.section>
    </div>
  );
}