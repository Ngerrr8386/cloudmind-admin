import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Shield, ShieldCheck, KeyRound, Mail, ServerCog, ArrowRight, Activity } from 'lucide-react';
import {
  GlassCard,
  Logo,
  Input,
  Toggle,
  Button,
  Badge,
} from '@/components/ui';
import { AnimatedBackground } from '@/components/ui';
import { cn } from '@/lib/utils';
import { tone } from '@/lib/theme';
import { scaleIn, fadeUp, fadeIn, staggerContainer, softSpring } from '@/lib/motion';

interface SecurityNote {
  icon: typeof Shield;
  label: string;
}

const securityNotes: SecurityNote[] = [
  { icon: ShieldCheck, label: 'Kết nối được mã hóa TLS 1.3' },
  { icon: Activity, label: 'Phiên đăng nhập giám sát theo thời gian thực' },
];

function FieldLabel({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      {children}
    </label>
  );
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [email, setEmail] = useState('admin@cloudmind.vn');
  const [password, setPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await auth.login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại, thử lại nhé');
      setSubmitting(false);
    }
  };

  const handleTwoFactor = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTwoFactor(next);
  };

  if (!auth.loading && auth.user) {
    return <Navigate to="/" replace />;
  }

  const indigo = tone('indigo');
  const emerald = tone('emerald');

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      <AnimatedBackground variant="subtle" />

      <motion.div
        variants={staggerContainer(0.08, 0.05)}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md"
      >
        {/* Environment pill */}
        <motion.div variants={fadeIn} className="mb-5 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm backdrop-blur">
            <ServerCog className="h-3.5 w-3.5 text-slate-400" />
            <span>cloudmind.vn / admin</span>
            <span className="mx-0.5 h-3 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Production
            </span>
          </span>
        </motion.div>

        <motion.div variants={scaleIn} transition={softSpring}>
          <GlassCard className="overflow-hidden p-0">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 border-b border-slate-100 px-7 pb-6 pt-8 text-center">
              <Logo size="lg" />

              <div className="mt-1 flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    indigo.soft,
                  )}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Khu vực hạn chế
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Đăng nhập quản trị
                </h1>
                <p className="max-w-xs text-sm text-slate-500">
                  Khu vực hạn chế — chỉ dành cho quản trị viên
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 px-7 py-7">
              {error && (
                <motion.div variants={fadeUp} className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                  {error}
                </motion.div>
              )}
              <motion.div variants={fadeUp}>
                <FieldLabel icon={Mail}>Email quản trị</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="admin@cloudmind.vn"
                  autoComplete="username"
                  required
                />
              </motion.div>

              <motion.div variants={fadeUp}>
                <FieldLabel icon={KeyRound}>Mật khẩu</FieldLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                />
              </motion.div>

              <motion.div variants={fadeUp}>
                <div className="mb-1.5 flex items-center justify-between">
                  <FieldLabel icon={Shield}>Mã xác thực 2 lớp</FieldLabel>
                  <Badge tone="neutral" className="text-[10px]">
                    6 số
                  </Badge>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={twoFactor}
                  onChange={handleTwoFactor}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  className="tracking-[0.5em] font-mono"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Nhập mã từ ứng dụng xác thực (Authenticator) của bạn.
                </p>
              </motion.div>

              {/* Remember device */}
              <motion.div
                variants={fadeUp}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">
                    Ghi nhớ thiết bị 30 ngày
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Bỏ qua 2FA trên thiết bị tin cậy này.
                  </span>
                </div>
                <Toggle checked={remember} onChange={setRemember} />
              </motion.div>

              <motion.div variants={fadeUp}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="group w-full justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Đang xác thực...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Đăng nhập
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Inline security assurances */}
              <motion.div variants={fadeIn} className="grid grid-cols-1 gap-2 pt-1">
                {securityNotes.map((note) => {
                  const Icon = note.icon;
                  return (
                    <div
                      key={note.label}
                      className="flex items-center gap-2 text-[11px] text-slate-400"
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-md',
                          emerald.soft,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      {note.label}
                    </div>
                  );
                })}
              </motion.div>
            </form>

            {/* Security footer */}
            <div className="flex items-start gap-2.5 border-t border-slate-100 bg-slate-50/80 px-7 py-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-[11px] leading-relaxed text-slate-500">
                Mọi thao tác đăng nhập đều được ghi nhật ký · IP của bạn được ghi lại.
                Truy cập trái phép sẽ bị xử lý theo chính sách bảo mật.
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Sub footer */}
        <motion.p
          variants={fadeIn}
          className="mt-6 text-center text-[11px] text-slate-400"
        >
          © {new Date().getFullYear()} CloudMind · Bảng điều khiển quản trị nội bộ
        </motion.p>
      </motion.div>
    </div>
  );
}