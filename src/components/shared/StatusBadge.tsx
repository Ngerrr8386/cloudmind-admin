import { cn } from '@/lib/utils'

type Variant = { label: string; cls: string; dot?: boolean }

/** Maps any known status string → a colored pill. Used across all admin tables. */
const MAP: Record<string, Variant> = {
  // user status
  active: { label: 'Hoạt động', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: true },
  trial: { label: 'Dùng thử', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: true },
  suspended: { label: 'Đã khóa', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: true },
  pending: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: true },
  // transaction status
  paid: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Thất bại', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  refunded: { label: 'Đã hoàn', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  // content status
  clean: { label: 'Sạch', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  flagged: { label: 'Gắn cờ', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  reviewing: { label: 'Đang xét', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  removed: { label: 'Đã gỡ', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  // severity
  info: { label: 'Thông tin', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  warning: { label: 'Cảnh báo', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  critical: { label: 'Nghiêm trọng', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  // tickets
  open: { label: 'Đang mở', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  closed: { label: 'Đã đóng', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  // priority
  high: { label: 'Cao', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  medium: { label: 'Trung bình', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Thấp', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  // system
  operational: { label: 'Ổn định', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: true },
  degraded: { label: 'Suy giảm', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: true },
  down: { label: 'Gián đoạn', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: true },
}

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const v = MAP[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', v.cls, className)}>
      {v.dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label ?? v.label}
    </span>
  )
}
