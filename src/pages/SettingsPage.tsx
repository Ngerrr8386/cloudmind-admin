import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  Sparkles,
  Gauge,
  ShieldCheck,
  Users,
  Plug,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  Repeat,
  Check,
  Minus,
  Brain,
  Search,
  MessageSquareText,
  FileText,
  FolderTree,
  Lightbulb,
  CreditCard,
  Wallet,
  Banknote,
  Slack,
  Globe,
  Lock,
  Cpu,
  HardDrive,
  Timer,
  ServerCog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Button,
  Badge,
  GlassCard,
  Avatar,
  Input,
  Toggle,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { TeamMember } from '@/lib/types';
import { tone, type Tone } from '@/lib/theme';
import { cn, timeAgo } from '@/lib/utils';
import { staggerContainer, fadeUp, fadeIn, softSpring } from '@/lib/motion';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useApi';
import { initialsOf, toneOf } from '@/lib/adminMap';

// ---------- settings shape (backend) ----------

interface AdminSettings {
  general: {
    appName: string;
    supportEmail: string;
    language: string;
    maintenance: boolean;
  };
  ai: {
    chatModel: string;
    embedModel: string;
    features: Record<string, boolean>;
    monthlyQuotaFree: number;
  };
  limits: {
    maxUploadMB: number;
    rateLimitPerMin: number;
  };
  security: {
    enforce2fa: boolean;
    sessionTimeoutMins: number;
    ipAllowlist: string[];
  };
  integrations: { key: string; name: string; enabled: boolean }[];
}

type TabId =
  | 'general'
  | 'ai'
  | 'limits'
  | 'security'
  | 'team'
  | 'integrations';

interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
  tone: Tone;
}

const TABS: TabDef[] = [
  { id: 'general', label: 'Chung', icon: Settings2, tone: 'indigo' },
  { id: 'ai', label: 'Cấu hình AI', icon: Sparkles, tone: 'violet' },
  { id: 'limits', label: 'Giới hạn', icon: Gauge, tone: 'blue' },
  { id: 'security', label: 'Bảo mật', icon: ShieldCheck, tone: 'emerald' },
  { id: 'team', label: 'Đội ngũ', icon: Users, tone: 'amber' },
  { id: 'integrations', label: 'Tích hợp', icon: Plug, tone: 'rose' },
];

// ---------- small in-file helpers ----------

function SectionCard({
  icon: Icon,
  title,
  description,
  toneKey,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  toneKey: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={cn('p-6', className)}>
      <div className="mb-5 flex items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            tone(toneKey).soft,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </GlassCard>
  );
}

function FieldLabel({
  label,
  hint,
  htmlFor,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  toneKey = 'indigo',
  icon: Icon,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  toneKey?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              tone(toneKey).soft,
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ---------- General tab ----------

function GeneralTab({ general }: { general: AdminSettings['general'] }) {
  const [appName, setAppName] = useState(general.appName);
  const [supportEmail, setSupportEmail] = useState(general.supportEmail);
  const [language, setLanguage] = useState(general.language);
  const [maintenance, setMaintenance] = useState(general.maintenance);
  const [allowSignup, setAllowSignup] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateGeneral({ appName, supportEmail, language, maintenance });
    } catch {
      /* lỗi: bỏ qua, giữ giá trị hiện tại */
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setAppName(general.appName);
    setSupportEmail(general.supportEmail);
    setLanguage(general.language);
    setMaintenance(general.maintenance);
  };

  const onMaintenance = (v: boolean) => {
    setMaintenance(v);
    void api.updateGeneral({ maintenance: v }).catch(() => {});
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard
        icon={Settings2}
        title="Thông tin chung"
        description="Cấu hình cơ bản của nền tảng."
        toneKey="indigo"
        className="lg:col-span-2"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel label="Tên ứng dụng" htmlFor="appName" />
            <Input
              id="appName"
              value={appName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAppName(e.target.value)
              }
              placeholder="CloudMind"
            />
          </div>
          <div>
            <FieldLabel label="Email hỗ trợ" htmlFor="supportEmail" />
            <Input
              id="supportEmail"
              type="email"
              value={supportEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSupportEmail(e.target.value)
              }
              placeholder="hotro@cloudmind.vn"
            />
          </div>
          <div>
            <FieldLabel label="Ngôn ngữ mặc định" htmlFor="language" />
            <select
              id="language"
              value={language}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setLanguage(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Button variant="ghost" size="md" onClick={reset}>
            Hủy
          </Button>
          <Button variant="primary" size="md" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        icon={ServerCog}
        title="Trạng thái hệ thống"
        description="Bật/tắt các chế độ vận hành."
        toneKey="amber"
      >
        <div className="space-y-3">
          <ToggleRow
            title="Chế độ bảo trì"
            description="Tạm ngưng truy cập cho người dùng cuối."
            checked={maintenance}
            onChange={onMaintenance}
            toneKey="rose"
            icon={AlertTriangle}
          />
          <AnimatePresence initial={false}>
            {maintenance && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={softSpring}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    Khi bật, toàn bộ người dùng sẽ thấy trang bảo trì. Chỉ
                    quản trị viên mới truy cập được bảng điều khiển.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ToggleRow
            title="Cho phép đăng ký mới"
            description="Bật để người dùng mới có thể tạo tài khoản."
            checked={allowSignup}
            onChange={setAllowSignup}
            toneKey="emerald"
            icon={Users}
          />
        </div>
      </SectionCard>
    </div>
  );
}

// ---------- AI tab ----------

interface AiModel {
  id: string;
  name: string;
  description: string;
  badge: string;
  badgeTone: Parameters<typeof Badge>[0]['tone'];
}

const AI_MODELS: AiModel[] = [
  {
    id: 'v2',
    name: 'CloudMind AI v2',
    description: 'Mô hình mới nhất, độ chính xác cao, hỗ trợ đa ngôn ngữ.',
    badge: 'Khuyến nghị',
    badgeTone: 'ai',
  },
  {
    id: 'v1',
    name: 'CloudMind AI v1',
    description: 'Ổn định, chi phí thấp, phù hợp khối lượng lớn.',
    badge: 'Tiết kiệm',
    badgeTone: 'mint',
  },
  {
    id: 'custom',
    name: 'Tùy chỉnh',
    description: 'Kết nối điểm cuối mô hình riêng của bạn.',
    badge: 'Nâng cao',
    badgeTone: 'neutral',
  },
];

interface AiFeature {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  toneKey: Tone;
  on: boolean;
}

const AI_FEATURE_DEFS: Omit<AiFeature, 'on'>[] = [
  {
    id: 'semantic',
    name: 'Tìm kiếm ngữ nghĩa',
    description: 'Tìm theo ý nghĩa thay vì từ khóa.',
    icon: Search,
    toneKey: 'indigo',
  },
  {
    id: 'qa',
    name: 'Hỏi đáp',
    description: 'Trả lời câu hỏi dựa trên tài liệu.',
    icon: MessageSquareText,
    toneKey: 'violet',
  },
  {
    id: 'summary',
    name: 'Tóm tắt',
    description: 'Tạo tóm tắt tự động cho tệp dài.',
    icon: FileText,
    toneKey: 'blue',
  },
  {
    id: 'folder',
    name: 'Gợi ý thư mục',
    description: 'Đề xuất sắp xếp tệp thông minh.',
    icon: FolderTree,
    toneKey: 'amber',
  },
  {
    id: 'knowledge',
    name: 'Khai thác tri thức',
    description: 'Trích xuất thực thể và liên kết tri thức.',
    icon: Lightbulb,
    toneKey: 'emerald',
  },
];

function AiTab({ ai }: { ai: AdminSettings['ai'] }) {
  const [activeModel, setActiveModel] = useState(
    AI_MODELS.some((m) => m.id === ai.chatModel) ? ai.chatModel : 'v2',
  );
  const [quota, setQuota] = useState(String(ai.monthlyQuotaFree ?? ''));
  const [features, setFeatures] = useState<AiFeature[]>(
    AI_FEATURE_DEFS.map((f) => ({ ...f, on: ai.features?.[f.id] ?? false })),
  );
  const [saving, setSaving] = useState(false);

  const toggleFeature = (id: string, value: boolean) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, on: value } : f)),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updateAiSettings({
        chatModel: activeModel,
        monthlyQuotaFree: Number(quota) || 0,
        features: Object.fromEntries(features.map((f) => [f.id, f.on])),
      });
    } catch {
      /* lỗi: bỏ qua */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard
        icon={Brain}
        title="Lựa chọn mô hình"
        description="Mô hình AI sử dụng cho toàn nền tảng."
        toneKey="violet"
        className="lg:col-span-2"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {AI_MODELS.map((m) => {
            const selected = m.id === activeModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModel(m.id)}
                className={cn(
                  'flex flex-col rounded-2xl border p-4 text-left transition-all',
                  selected
                    ? 'border-violet-400 bg-violet-50/60 ring-2 ring-violet-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl',
                      selected ? tone('violet').solid : tone('violet').soft,
                    )}
                  >
                    <Cpu className="h-4 w-4" />
                  </span>
                  {selected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {m.name}
                </p>
                <p className="mt-1 flex-1 text-xs text-slate-500">
                  {m.description}
                </p>
                <div className="mt-3">
                  <Badge tone={m.badgeTone}>{m.badge}</Badge>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 max-w-xs">
          <FieldLabel
            label="Hạn mức AI miễn phí / tháng"
            hint="lượt gọi"
            htmlFor="quota"
          />
          <Input
            id="quota"
            type="number"
            value={quota}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuota(e.target.value)
            }
            placeholder="500"
          />
        </div>

        <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-5">
          <Button variant="primary" size="md" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        icon={Sparkles}
        title="Tính năng AI"
        description="Bật/tắt từng tính năng."
        toneKey="indigo"
      >
        <div className="space-y-3">
          {features.map((f) => (
            <ToggleRow
              key={f.id}
              title={f.name}
              description={f.description}
              checked={f.on}
              onChange={(v) => toggleFeature(f.id, v)}
              toneKey={f.toneKey}
              icon={f.icon}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ---------- Limits tab ----------

function LimitsTab({ limits }: { limits: AdminSettings['limits'] }) {
  const [maxFile, setMaxFile] = useState(String(limits.maxUploadMB ?? ''));
  const [freeStorage, setFreeStorage] = useState('5');
  const [proStorage, setProStorage] = useState('200');
  const [teamStorage, setTeamStorage] = useState('2000');
  const [rateLimit, setRateLimit] = useState(String(limits.rateLimitPerMin ?? ''));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateLimits({
        maxUploadMB: Number(maxFile) || 0,
        rateLimitPerMin: Number(rateLimit) || 0,
      });
    } catch {
      /* lỗi: bỏ qua */
    } finally {
      setSaving(false);
    }
  };

  const planStorage: {
    label: string;
    value: string;
    setter: (v: string) => void;
    toneKey: Tone;
  }[] = [
    { label: 'Gói Free', value: freeStorage, setter: setFreeStorage, toneKey: 'slate' },
    { label: 'Gói Pro', value: proStorage, setter: setProStorage, toneKey: 'indigo' },
    { label: 'Gói Team', value: teamStorage, setter: setTeamStorage, toneKey: 'violet' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard
        icon={HardDrive}
        title="Giới hạn tệp & dung lượng"
        description="Cấu hình kích thước và dung lượng lưu trữ."
        toneKey="blue"
      >
        <div className="space-y-5">
          <div className="max-w-xs">
            <FieldLabel
              label="Kích thước file tối đa"
              hint="MB"
              htmlFor="maxFile"
            />
            <Input
              id="maxFile"
              type="number"
              value={maxFile}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMaxFile(e.target.value)
              }
              placeholder="2048"
            />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Dung lượng mặc định mỗi gói (GB)
            </p>
            <div className="space-y-3">
              {planStorage.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      tone(p.toneKey).soft,
                    )}
                  >
                    <HardDrive className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700">
                    {p.label}
                  </span>
                  <div className="w-32">
                    <Input
                      type="number"
                      value={p.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        p.setter(e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Timer}
        title="Giới hạn tần suất"
        description="Bảo vệ hệ thống khỏi quá tải."
        toneKey="amber"
      >
        <div className="max-w-xs">
          <FieldLabel
            label="Rate limit"
            hint="request / phút"
            htmlFor="rateLimit"
          />
          <Input
            id="rateLimit"
            type="number"
            value={rateLimit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRateLimit(e.target.value)
            }
            placeholder="120"
          />
        </div>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
          <p className="text-xs text-slate-500">
            Vượt quá ngưỡng này, hệ thống sẽ trả về mã lỗi{' '}
            <span className="font-mono font-semibold text-slate-700">429</span>{' '}
            và yêu cầu thử lại sau.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-5">
          <Button variant="primary" size="md" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu…' : 'Lưu giới hạn'}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

// ---------- Security tab ----------

const PASSWORD_POLICY = [
  'Tối thiểu 8 ký tự',
  'Có chữ hoa & chữ thường',
  'Có ít nhất 1 số',
  'Có ký tự đặc biệt',
  'Không trùng 3 mật khẩu gần nhất',
];

function SecurityTab({ security }: { security: AdminSettings['security'] }) {
  const [force2fa, setForce2fa] = useState(security.enforce2fa);
  const [sessionTimeout, setSessionTimeout] = useState(
    String(security.sessionTimeoutMins ?? ''),
  );
  const [ipRestrict, setIpRestrict] = useState(
    (security.ipAllowlist ?? []).length > 0,
  );
  const [allowlist, setAllowlist] = useState(
    (security.ipAllowlist ?? []).join('\n'),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateSecurity({
        enforce2fa: force2fa,
        sessionTimeoutMins: Number(sessionTimeout) || 0,
        ipAllowlist: ipRestrict
          ? allowlist
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
      });
    } catch {
      /* lỗi: bỏ qua */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard
        icon={ShieldCheck}
        title="Xác thực & phiên"
        description="Tăng cường bảo mật truy cập quản trị."
        toneKey="emerald"
      >
        <div className="space-y-3">
          <ToggleRow
            title="Bắt buộc 2FA cho quản trị viên"
            description="Yêu cầu xác thực hai lớp khi đăng nhập."
            checked={force2fa}
            onChange={setForce2fa}
            toneKey="emerald"
            icon={ShieldCheck}
          />
          <div className="max-w-xs pt-1">
            <FieldLabel
              label="Thời gian hết phiên"
              hint="phút"
              htmlFor="sessionTimeout"
            />
            <Input
              id="sessionTimeout"
              type="number"
              value={sessionTimeout}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSessionTimeout(e.target.value)
              }
              placeholder="30"
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Chính sách mật khẩu
          </p>
          <div className="flex flex-wrap gap-2">
            {PASSWORD_POLICY.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
              >
                <Check className="h-3.5 w-3.5" />
                {p}
              </span>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Lock}
        title="Kiểm soát truy cập IP"
        description="Giới hạn theo địa chỉ IP."
        toneKey="rose"
      >
        <div className="space-y-3">
          <ToggleRow
            title="Chỉ cho phép IP trong danh sách"
            description="Từ chối mọi truy cập ngoài danh sách dưới đây."
            checked={ipRestrict}
            onChange={setIpRestrict}
            toneKey="rose"
            icon={Lock}
          />
          <div className={cn(!ipRestrict && 'opacity-60')}>
            <FieldLabel
              label="Danh sách IP cho phép"
              hint="mỗi dòng một IP / dải"
              htmlFor="allowlist"
            />
            <textarea
              id="allowlist"
              value={allowlist}
              disabled={!ipRestrict}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setAllowlist(e.target.value)
              }
              rows={5}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-700 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="203.113.0.0/16"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-5">
          <Button variant="primary" size="md" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu…' : 'Lưu cài đặt'}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

// ---------- Team tab ----------

const ROLE_TONE: Record<TeamMember['role'], NonNullable<Parameters<typeof Badge>[0]['tone']>> = {
  Owner: 'ai',
  Admin: 'brand',
  Moderator: 'sun',
  Support: 'sky',
};

const ROLE_LABEL: Record<TeamMember['role'], string> = {
  Owner: 'Chủ sở hữu',
  Admin: 'Quản trị',
  Moderator: 'Kiểm duyệt',
  Support: 'Hỗ trợ',
};

interface PermissionRow {
  label: string;
  roles: Record<TeamMember['role'], boolean>;
}

const PERMISSION_MATRIX: PermissionRow[] = [
  {
    label: 'Quản lý người dùng',
    roles: { Owner: true, Admin: true, Moderator: false, Support: false },
  },
  {
    label: 'Kiểm duyệt nội dung',
    roles: { Owner: true, Admin: true, Moderator: true, Support: false },
  },
  {
    label: 'Xem giao dịch',
    roles: { Owner: true, Admin: true, Moderator: false, Support: true },
  },
  {
    label: 'Cấu hình hệ thống',
    roles: { Owner: true, Admin: false, Moderator: false, Support: false },
  },
  {
    label: 'Trả lời hỗ trợ',
    roles: { Owner: true, Admin: true, Moderator: true, Support: true },
  },
];

const ROLE_ORDER: TeamMember['role'][] = [
  'Owner',
  'Admin',
  'Moderator',
  'Support',
];

const TEAM_ROLE_CYCLE: TeamMember['role'][] = [
  'Admin',
  'Moderator',
  'Support',
];

function TeamTab() {
  const { data, loading, reload } = useAsync(() => api.team(), []);

  const members: TeamMember[] = (Array.isArray(data) ? data : []).map(
    (m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      initials: initialsOf(m.name),
      tone: toneOf(m.id ?? m.email),
      role: (m.role as TeamMember['role']) ?? 'Admin',
      lastActive: m.lastActiveAt ?? m.createdAt,
      online: false,
    }),
  );

  const invite = async () => {
    const email = window.prompt('Email thành viên muốn mời:');
    if (!email) return;
    try {
      await api.inviteTeam({ email });
    } catch {
      /* lỗi: bỏ qua */
    }
    reload();
  };

  const changeRole = async (m: TeamMember) => {
    const idx = TEAM_ROLE_CYCLE.indexOf(m.role);
    const next = TEAM_ROLE_CYCLE[(idx + 1) % TEAM_ROLE_CYCLE.length];
    try {
      await api.updateTeamRole(m.id, next);
    } catch {
      /* lỗi: bỏ qua */
    }
    reload();
  };

  const remove = async (m: TeamMember) => {
    try {
      await api.removeTeam(m.id);
    } catch {
      /* lỗi: bỏ qua */
    }
    reload();
  };

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Users}
        title="Thành viên đội ngũ"
        description="Quản lý quyền truy cập của đội ngũ vận hành."
        toneKey="amber"
      >
        <div className="mb-4 flex justify-end">
          <Button variant="primary" size="md" onClick={invite}>
            <Plus className="h-4 w-4" />
            Mời thành viên
          </Button>
        </div>

        <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200 shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Thành viên</th>
                <th className="px-5 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    Chưa có thành viên nào trong đội ngũ.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={m.initials} tone={m.tone} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">{m.name}</p>
                          <p className="truncate text-xs text-slate-400">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={ROLE_TONE[m.role]}>
                        {ROLE_LABEL[m.role]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            m.online ? 'bg-emerald-500' : 'bg-slate-300',
                          )}
                        />
                        <span className="text-slate-600">
                          {m.online ? 'Đang hoạt động' : timeAgo(m.lastActive)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => changeRole(m)}
                          disabled={m.role === 'Owner'}
                        >
                          <Repeat className="h-3.5 w-3.5" />
                          Đổi vai trò
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          disabled={m.role === 'Owner'}
                          onClick={() => remove(m)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Gỡ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 text-xs text-slate-400">
            <span>
              Hiển thị 1–{members.length} / tổng {members.length}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Trước
              </Button>
              <Button variant="outline" size="sm" disabled>
                Sau
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={ShieldCheck}
        title="Phân quyền theo vai trò"
        description="Ma trận quyền hạn của từng vai trò."
        toneKey="indigo"
      >
        <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200 shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Quyền hạn</th>
                {ROLE_ORDER.map((r) => (
                  <th key={r} className="px-5 py-3.5 text-center">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSION_MATRIX.map((row) => (
                <tr
                  key={row.label}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {row.label}
                  </td>
                  {ROLE_ORDER.map((r) => (
                    <td key={r} className="px-5 py-4 text-center">
                      {row.roles[r] ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                          <Minus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ---------- Integrations tab ----------

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  toneKey: Tone;
  connected: boolean;
}

const INTEGRATION_META: Record<
  string,
  { description: string; icon: LucideIcon; toneKey: Tone }
> = {
  stripe: {
    description: 'Cổng thanh toán thẻ quốc tế cho gói trả phí.',
    icon: CreditCard,
    toneKey: 'violet',
  },
  momo: {
    description: 'Ví điện tử nội địa phổ biến nhất Việt Nam.',
    icon: Wallet,
    toneKey: 'rose',
  },
  zalopay: {
    description: 'Thanh toán qua ví ZaloPay & QR.',
    icon: Banknote,
    toneKey: 'blue',
  },
  slack: {
    description: 'Gửi cảnh báo hệ thống & thông báo vào kênh nội bộ.',
    icon: Slack,
    toneKey: 'amber',
  },
  google: {
    description: 'Đăng nhập SSO & đồng bộ danh bạ tổ chức.',
    icon: Globe,
    toneKey: 'emerald',
  },
};

function IntegrationsTab({
  integrations,
}: {
  integrations: AdminSettings['integrations'];
}) {
  const [items, setItems] = useState<IntegrationDef[]>(
    (integrations ?? []).map((i) => {
      const meta = INTEGRATION_META[i.key];
      return {
        id: i.key,
        name: i.name,
        description: meta?.description ?? '',
        icon: meta?.icon ?? Plug,
        toneKey: meta?.toneKey ?? toneOf(i.key),
        connected: i.enabled,
      };
    }),
  );

  const toggle = (id: string, value: boolean) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: value } : i)),
    );
    void api.updateIntegration(id, { enabled: value }).catch(() => {});
  };

  const connectedCount = items.filter((i) => i.connected).length;

  return (
    <SectionCard
      icon={Plug}
      title="Tích hợp dịch vụ"
      description={`Đã kết nối ${connectedCount} / ${items.length} dịch vụ.`}
      toneKey="rose"
    >
      <div className="space-y-3">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  tone(i.toneKey).soft,
                )}
              >
                <i.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {i.name}
                  </p>
                  <StatusBadge
                    status={i.connected ? 'operational' : 'down'}
                    label={i.connected ? 'Đã kết nối' : 'Chưa kết nối'}
                  />
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {i.description}
                </p>
              </div>
            </div>
            <Toggle
              checked={i.connected}
              onChange={(v) => toggle(i.id, v)}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------- tab content router ----------

function TabContent({
  tab,
  settings,
}: {
  tab: TabId;
  settings: AdminSettings;
}) {
  switch (tab) {
    case 'general':
      return <GeneralTab general={settings.general} />;
    case 'ai':
      return <AiTab ai={settings.ai} />;
    case 'limits':
      return <LimitsTab limits={settings.limits} />;
    case 'security':
      return <SecurityTab security={settings.security} />;
    case 'team':
      return <TeamTab />;
    case 'integrations':
      return <IntegrationsTab integrations={settings.integrations} />;
  }
}

// ---------- page ----------

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const { data: settings, loading } = useAsync(() => api.settings(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Cài đặt"
        subtitle="Cấu hình toàn bộ nền tảng CloudMind từ một nơi duy nhất."
        actions={
          <Button variant="primary" size="md">
            <Save className="h-4 w-4" />
            Lưu tất cả
          </Button>
        }
      />

      {/* mobile chip nav */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        {TABS.map((t) => {
          const active = t.id === activeTab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? cn(tone(t.tone).solid, 'border-transparent')
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* desktop vertical nav */}
        <aside className="hidden lg:block">
          <GlassCard className="sticky top-6 p-3">
            <nav className="space-y-1">
              {TABS.map((t) => {
                const active = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="settings-active-pill"
                        className={cn(
                          'absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full',
                          tone(t.tone).dot,
                        )}
                        transition={softSpring}
                      />
                    )}
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        active
                          ? tone(t.tone).soft
                          : 'bg-slate-100 text-slate-400',
                      )}
                    >
                      <t.icon className="h-4 w-4" />
                    </span>
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </GlassCard>
        </aside>

        {/* content */}
        <main className="min-w-0">
          {loading || !settings ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={staggerContainer(0.06)}
                initial="hidden"
                animate="show"
                exit={fadeIn.hidden ? { opacity: 0, y: -8 } : { opacity: 0 }}
              >
                <motion.div variants={fadeUp}>
                  <TabContent tab={activeTab} settings={settings} />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}