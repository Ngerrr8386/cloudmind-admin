import { Search, Menu, LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { useAuth } from '@/lib/auth'

export function AdminTopbar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-surface-0/85 px-4 backdrop-blur-xl md:px-6">
      <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden ring-focus">
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search */}
      <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-400 md:max-w-md">
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Tìm người dùng, giao dịch, file...</span>
        <kbd className="hidden rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 md:inline-block">⌘K</kbd>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Production
        </span>
        <button
          onClick={logout}
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className="flex items-center gap-2 rounded-2xl py-1 pl-1 pr-2 hover:bg-slate-100 ring-focus"
        >
          <Avatar initials={user?.initials ?? 'A'} tone={user?.tone ?? 'indigo'} size="sm" />
          <LogOut className="hidden h-4 w-4 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  )
}
