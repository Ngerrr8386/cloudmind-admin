import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, RequireAuth } from '@/lib/auth'
import { AdminShell } from '@/components/layout/AdminShell'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { UsersPage } from '@/pages/UsersPage'
import { UserDetailPage } from '@/pages/UserDetailPage'
import { WorkspacesPage } from '@/pages/WorkspacesPage'
import { ContentPage } from '@/pages/ContentPage'
import { BillingPage } from '@/pages/BillingPage'
import { PlansPage } from '@/pages/PlansPage'
import { AIAnalyticsPage } from '@/pages/AIAnalyticsPage'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { SettingsPage } from '@/pages/SettingsPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/" element={<RequireAuth><AdminShell /></RequireAuth>}>
            <Route index element={<OverviewPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="workspaces" element={<WorkspacesPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="ai" element={<AIAnalyticsPage />} />
            <Route path="audit" element={<AuditLogPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
