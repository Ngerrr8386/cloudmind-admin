import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, ShieldAlert, CreditCard, Package,
  BrainCircuit, ScrollText, Settings, LifeBuoy, LogOut, type LucideIcon,
} from 'lucide-react'
import { Logo, Avatar } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Tổng quan',
    items: [{ to: '/', label: 'Bảng điều khiển', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Quản lý',
    items: [
      { to: '/users', label: 'Người dùng', icon: Users },
      { to: '/content', label: 'Nội dung & Kiểm duyệt', icon: ShieldAlert },
      { to: '/plans', label: 'Gói cước', icon: Package },
    ],
  },
  {
    title: 'Tài chính & AI',
    items: [
      { to: '/billing', label: 'Doanh thu', icon: CreditCard },
      { to: '/ai', label: 'Phân tích AI', icon: BrainCircuit },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/audit', label: 'Nhật ký', icon: ScrollText },
      { to: '/settings', label: 'Cài đặt', icon: Settings },
    ],
  },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  return (
    <aside className="flex h-full w-[264px] flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive ? 'text-ink-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="admin-active"
                          className="absolute inset-0 rounded-xl bg-ink-50 border border-ink-200"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      <item.icon className={cn('relative h-[18px] w-[18px] shrink-0', isActive && 'text-ink-600')} />
                      <span className="relative">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Support + admin profile */}
      <div className="border-t border-slate-200 p-3">
        <a href="#" className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900">
          <LifeBuoy className="h-[18px] w-[18px]" />
          Trợ giúp & Tài liệu
        </a>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
          <Avatar initials={user?.initials ?? 'A'} tone={user?.tone ?? 'indigo'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">{user?.name ?? 'Quản trị viên'}</p>
            <p className="truncate text-xs text-slate-400">{user?.role === 'admin' ? 'Quản trị viên' : user?.email}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Đăng xuất"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
