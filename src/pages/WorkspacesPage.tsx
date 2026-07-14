import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  ShieldOff,
  Sofa,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Crown,
  ShieldCheck,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { Avatar, Badge, Button, Input, Modal } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { initialsOf, toneOf } from '@/lib/adminMap';
import { tone } from '@/lib/theme';
import { cn, formatNumber } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeUpLg } from '@/lib/motion';

const PAGE_LIMIT = 10;

interface AdminWorkspace {
  id: string;
  name: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  seats: number;
  status: 'active' | 'suspended';
  memberCount: number;
  createdAt: string;
}

interface AdminWsMember {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  wsRole: 'owner' | 'wsadmin' | 'member';
  joinedAt: string;
}

const ROLE_LABEL: Record<string, string> = { owner: 'Chủ sở hữu', wsadmin: 'Quản trị', member: 'Thành viên' };

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'suspended', label: 'Đã khóa' },
];

function mapWs(w: any): AdminWorkspace {
  return {
    id: String(w?.id ?? ''),
    name: w?.name ?? '(không tên)',
    ownerId: w?.ownerId ?? null,
    ownerName: w?.ownerName ?? null,
    ownerEmail: w?.ownerEmail ?? null,
    seats: w?.seats ?? 0,
    status: w?.status === 'suspended' ? 'suspended' : 'active',
    memberCount: w?.memberCount ?? 0,
    createdAt: w?.createdAt ?? '',
  };
}

export function WorkspacesPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminWorkspace | null>(null);

  const { data, loading, reload } = useAsync(
    () =>
      api.workspaces({
        page,
        limit: PAGE_LIMIT,
        q: query.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    [page, query, statusFilter],
  );

  const rows = useMemo<AdminWorkspace[]>(() => (data?.items ?? []).map(mapWs), [data]);
  const total = data?.meta?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd = (page - 1) * PAGE_LIMIT + rows.length;
  const hasPrev = page > 1;
  const hasNext = rangeEnd < total;

  const suspendedCount = useMemo(() => rows.filter((w) => w.status === 'suspended').length, [rows]);
  const totalSeats = useMemo(() => rows.reduce((s, w) => s + w.seats, 0), [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Không gian nhóm"
        subtitle={`${formatNumber(total)} không gian làm việc trên toàn hệ thống`}
      />

      {/* Stat cards */}
      <motion.div variants={staggerContainer()} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label="Tổng không gian" value={formatNumber(total)} tone="indigo" />
        <StatCard icon={Users} label="Hiển thị (trang này)" value={formatNumber(rows.length)} tone="violet" />
        <StatCard icon={Sofa} label="Tổng ghế (trang này)" value={formatNumber(totalSeats)} tone="emerald" />
        <StatCard icon={ShieldOff} label="Đã khóa (trang này)" value={formatNumber(suspendedCount)} tone="rose" />
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={fadeUpLg} initial="hidden" animate="show" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên không gian..."
              className="pl-9"
            />
          </div>
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
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-card">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <EmptyState
            icon={Building2}
            title="Không tìm thấy không gian nào"
            description="Thử điều chỉnh từ khóa hoặc bộ lọc trạng thái."
            action={
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setQuery('');
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
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Không gian</th>
                  <th className="px-5 py-3.5">Chủ sở hữu</th>
                  <th className="px-5 py-3.5">Thành viên</th>
                  <th className="px-5 py-3.5">Ghế</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Tạo ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((w) => (
                  <tr key={w.id} onClick={() => setSelected(w)} className="cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-sm font-bold text-ink-600">
                          {initialsOf(w.name)}
                        </div>
                        <div className="truncate font-medium text-slate-900">{w.name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {w.ownerName || w.ownerEmail ? (
                        <div className="min-w-0">
                          <div className="truncate text-slate-700">{w.ownerName ?? '—'}</div>
                          <div className="truncate text-xs text-slate-400">{w.ownerEmail ?? ''}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatNumber(w.memberCount)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatNumber(w.seats)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {w.createdAt ? new Date(w.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 sm:flex-row">
              <p className="text-xs text-slate-400">
                Hiển thị <span className="font-medium text-slate-600">{rangeStart}–{rangeEnd}</span> / tổng{' '}
                <span className="font-medium text-slate-600">{formatNumber(total)}</span> không gian
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <span className={cn('rounded-lg px-3 py-1 text-xs font-medium', tone('indigo').soft)}>{page}</span>
                <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {selected && (
        <WorkspaceDetailModal
          ws={selected}
          onClose={() => setSelected(null)}
          onChanged={(patch) => {
            setSelected((cur) => (cur ? { ...cur, ...patch } : cur));
            reload();
          }}
        />
      )}
    </div>
  );
}

function WorkspaceDetailModal({
  ws,
  onClose,
  onChanged,
}: {
  ws: AdminWorkspace;
  onClose: () => void;
  onChanged: (patch: Partial<AdminWorkspace>) => void;
}) {
  const { data: members, loading } = useAsync(() => api.workspaceMembers(ws.id) as Promise<AdminWsMember[]>, [ws.id]);
  const [seats, setSeats] = useState(String(ws.seats));
  const [savingSeats, setSavingSeats] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  async function saveSeats() {
    const n = Number(seats);
    if (!Number.isInteger(n) || n < 1) {
      setMsg({ tone: 'err', text: 'Số ghế phải là số nguyên ≥ 1' });
      return;
    }
    setSavingSeats(true);
    setMsg(null);
    try {
      const res = await api.updateWorkspaceSeats(ws.id, n);
      onChanged({ seats: res?.seats ?? n });
      setMsg({ tone: 'ok', text: `Đã cập nhật thành ${res?.seats ?? n} ghế` });
    } catch (e) {
      setMsg({ tone: 'err', text: e instanceof Error ? e.message : 'Không cập nhật được số ghế' });
    } finally {
      setSavingSeats(false);
    }
  }

  async function toggleSuspend() {
    const suspend = ws.status !== 'suspended';
    if (!window.confirm(suspend ? `Tạm khóa "${ws.name}"?` : `Mở khóa "${ws.name}"?`)) return;
    setSuspending(true);
    setMsg(null);
    try {
      const res = await api.suspendWorkspace(ws.id, suspend);
      onChanged({ status: res?.status ?? (suspend ? 'suspended' : 'active') });
      setMsg({ tone: 'ok', text: suspend ? 'Đã tạm khóa không gian' : 'Đã mở khóa không gian' });
    } catch (e) {
      setMsg({ tone: 'err', text: e instanceof Error ? e.message : 'Không đổi được trạng thái' });
    } finally {
      setSuspending(false);
    }
  }

  const rows = members ?? [];
  const suspended = ws.status === 'suspended';

  return (
    <Modal open onClose={onClose} title={ws.name} className="max-w-2xl">
      {/* Summary */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3 text-center">
          <div className="text-lg font-bold text-slate-900">{ws.memberCount}</div>
          <div className="text-xs text-slate-500">Thành viên</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-center">
          <div className="text-lg font-bold text-slate-900">{ws.seats}</div>
          <div className="text-xs text-slate-500">Ghế</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-center">
          <div className="mt-1 flex justify-center">
            <StatusBadge status={ws.status} />
          </div>
          <div className="mt-1 text-xs text-slate-500">Trạng thái</div>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
        <div className="text-slate-500">Chủ sở hữu</div>
        <div className="font-semibold text-slate-800">{ws.ownerName ?? '—'}</div>
        <div className="text-xs text-slate-400">{ws.ownerEmail ?? ''}</div>
      </div>

      {/* Actions */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Số ghế</label>
          <Input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} />
        </div>
        <Button variant="primary" size="md" className="shrink-0" disabled={savingSeats} onClick={saveSeats}>
          {savingSeats ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sofa className="h-4 w-4" />}
          Lưu ghế
        </Button>
        <Button
          variant={suspended ? 'secondary' : 'danger'}
          size="md"
          className="shrink-0"
          disabled={suspending}
          onClick={toggleSuspend}
        >
          {suspending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : suspended ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          {suspended ? 'Mở khóa' : 'Tạm khóa'}
        </Button>
      </div>
      {msg && <p className={cn('mb-4 text-sm', msg.tone === 'ok' ? 'text-emerald-600' : 'text-rose-600')}>{msg.text}</p>}

      {/* Members */}
      <div className="mb-2 text-sm font-bold text-slate-900">Thành viên ({rows.length})</div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">Chưa có thành viên nào.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {rows.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
              <Avatar initials={initialsOf(m.userName ?? undefined)} tone={toneOf(m.userId ?? m.userEmail ?? undefined)} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{m.userName ?? 'Không rõ'}</div>
                <div className="truncate text-xs text-slate-400">{m.userEmail ?? ''}</div>
              </div>
              {m.wsRole === 'owner' ? (
                <Badge tone="brand">
                  <Crown className="h-3 w-3" />
                  {ROLE_LABEL.owner}
                </Badge>
              ) : m.wsRole === 'wsadmin' ? (
                <Badge tone="sky">
                  <ShieldCheck className="h-3 w-3" />
                  {ROLE_LABEL.wsadmin}
                </Badge>
              ) : (
                <Badge tone="neutral">{ROLE_LABEL.member}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
