import { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Bell,
  FileText,
  BarChart2,
  Search,
  X,
  RefreshCw,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
  UserCog,
  Sparkles,
  Filter,
  Radio,
} from 'lucide-react';
import api from '@/Api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { NOTIF_STATUS } from '@/Util/statusConfig';
import { readableTimestamp, readableDate } from '@/Util/readableDate';
import SendNotificationModal from './SendNotificationModal';
import BroadcastModal from './BroadcastModal';
import TemplateEditor from './TemplateEditor';
import ParametresCanaux from './ParametresCanaux';
import ClientPreferencesModal from './ClientPreferencesModal';

const CHANNEL_LABELS = {
  email: { label: 'Email', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300' },
  sms: { label: 'SMS', color: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' },
  whatsapp: { label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  push: { label: 'Push', color: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300' },
  in_app: { label: 'In-App', color: 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white/70' },
};

const TABS = [
  { key: 'journal', label: 'Journal', icon: Bell },
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'stats', label: 'Statistiques', icon: BarChart2 },
  { key: 'settings', label: 'Paramètres', icon: Settings },
];

function ResendBtn({ id, onDone }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const resend = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await api.post(`/notifications/${id}/resend`);
      setDone(true);
      onDone?.();
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <span className="text-xs text-emerald-600">Renvoyé</span>;
  }

  return (
    <Button size="sm" variant="outline" className="rounded-xl" onClick={resend} disabled={loading}>
      {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      Renvoyer
    </Button>
  );
}

const COLUMNS = [
  {
    key: 'type',
    label: 'Type',
    render: (v) => (
      <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
        {v}
      </span>
    ),
  },
  {
    key: 'channel',
    label: 'Canal',
    render: (v) => {
      const c = CHANNEL_LABELS[v] || {
        label: v,
        color: 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white/70',
      };
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.color}`}>
          {c.label}
        </span>
      );
    },
  },
  {
    key: 'recipient',
    label: 'Destinataire',
    render: (v) => <span className="text-sm">{v}</span>,
  },
  {
    key: 'status',
    label: 'Statut',
    render: (v) => <StatusBadge map={NOTIF_STATUS} value={v} />,
  },
  {
    key: 'error_reason',
    label: 'Erreur',
    render: (v) =>
      v ? (
        <span className="block max-w-[140px] truncate text-xs text-destructive">
          {v}
        </span>
      ) : (
        '—'
      ),
  },
  {
    key: 'created_at',
    label: 'Envoyé',
    render: (v) => (
      <span className="text-xs text-muted-foreground">{readableTimestamp(v)}</span>
    ),
  },
  {
    key: 'actions',
    label: '',
    render: (_, row) =>
      row.status === 'failed' ? <ResendBtn id={row.id} onDone={() => {}} /> : null,
  },
];

function StatCard({ label, value, sub, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  };

  return (
    <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone] || tones.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState('journal');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    channel: '',
    search: '',
    page: 1,
    limit: 20,
  });

  const [showSend, setShowSend] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [detail, setDetail] = useState(null);

  const [showClientPrefs, setShowClientPrefs] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const r = await api.get('/notifications', { params });
      setData(r.data.data);
      setMeta(r.data.meta);
    } catch {
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get('/notifications/stats/summary');
      setStats(r.data.data);
    } catch {}
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const r = await api.get('/notifications/templates/list');
      setTemplates(r.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === 'journal') fetchLog();
  }, [tab, fetchLog]);

  useEffect(() => {
    if (tab === 'stats') fetchStats();
  }, [tab, fetchStats]);

  useEffect(() => {
    if (tab === 'templates') fetchTemplates();
  }, [tab, fetchTemplates]);

  const openClientPrefs = (row) => {
    if (!row?.client_id) return;
    setSelectedClient({
      id: row.client_id,
      name: row.client_name || row.recipient || 'Client',
    });
    setShowClientPrefs(true);
  };

  const hasFilters = filters.search || filters.status || filters.channel;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Bell className="h-3.5 w-3.5" />
              Centre de notifications
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Notifications
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              
            </p>
          </div>

          {tab !== 'settings' ? (
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setShowBroadcast(true)}>
                <Radio size={15} />
                Broadcast
              </Button>
              <Button className="h-11 rounded-2xl px-5 shadow-[0_12px_24px_hsl(var(--primary)/0.22)]" onClick={() => setShowSend(true)}>
                <Plus size={15} />
                Envoyer
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {tab === 'journal' ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total notifications" value={loading ? '...' : meta?.total ?? 0} sub="Journal paginé" icon={Bell} tone="primary" />
          <StatCard label="Page actuelle" value={loading ? '...' : filters.page} sub="Navigation" icon={Filter} tone="violet" />
          <StatCard label="Par page" value={filters.limit} sub="Volume affiché" icon={ArrowUpRightFallback} tone="orange" />
          <StatCard label="Filtres actifs" value={hasFilters ? 'Oui' : 'Non'} sub="Recherche ciblée" icon={Search} tone="emerald" />
        </section>
      ) : null}

      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))] text-white shadow-[0_12px_24px_hsl(var(--primary)/0.18)]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'journal' ? (
        <div className="space-y-4">
          <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Filtres</h2>
                <p className="text-sm text-muted-foreground">
                  Recherche par type, destinataire, canal ou statut
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Destinataire, type…"
                  className="h-11 w-56 rounded-2xl pl-8"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
                  }
                />
              </div>

              <select
                className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
                }
              >
                <option value="">Tous les statuts</option>
                {Object.entries(NOTIF_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>

              <select
                className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
                value={filters.channel}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, channel: e.target.value, page: 1 }))
                }
              >
                <option value="">Tous les canaux</option>
                {Object.keys(CHANNEL_LABELS).map((k) => (
                  <option key={k} value={k}>
                    {CHANNEL_LABELS[k].label}
                  </option>
                ))}
              </select>

              {hasFilters ? (
                <Button
                  variant="ghost"
                  className="h-11 rounded-2xl"
                  onClick={() =>
                    setFilters({
                      status: '',
                      channel: '',
                      search: '',
                      page: 1,
                      limit: 20,
                    })
                  }
                >
                  <X size={14} />
                  Réinitialiser
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-3 shadow-sm md:p-4">
            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <DataTable
              columns={COLUMNS}
              data={data}
              loading={loading}
              error={null}
              onRowClick={(row) => setDetail(row)}
            />
          </section>

          <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
            <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
          </div>
        </div>
      ) : null}

      {tab === 'templates' ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {!templates.length ? (
            <p className="col-span-3 text-sm text-muted-foreground">
              Aucun template trouvé.
            </p>
          ) : (
            templates.map((t) => (
              <Card
                key={t.id}
                className="cursor-pointer overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                onClick={() => setEditingTemplate(t)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        CHANNEL_LABELS[t.channel]?.color || 'bg-muted'
                      }`}
                    >
                      {CHANNEL_LABELS[t.channel]?.label || t.channel}
                    </span>
                    <Badge variant={t.is_active ? 'success' : 'outline'}>
                      {t.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-base">{t.name}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="font-mono text-xs text-muted-foreground">{t.type}</p>

                  {t.subject ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      Objet: {t.subject}
                    </p>
                  ) : null}

                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {t.content}
                  </p>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Modifier le template
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      ) : null}

      {tab === 'stats' ? (
        <div className="space-y-5">
          {!stats ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((row) => (
                <Card
                  key={row.channel}
                  className="overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm"
                >
                  <CardContent className="pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          CHANNEL_LABELS[row.channel]?.color || 'bg-muted'
                        }`}
                      >
                        {CHANNEL_LABELS[row.channel]?.label || row.channel}
                      </span>
                      <span className="text-2xl font-bold">{row.total}</span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CheckCircle size={12} className="text-emerald-500" />
                          Envoyés
                        </span>
                        <span className="font-medium">{row.sent}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <XCircle size={12} className="text-destructive" />
                          Échoués
                        </span>
                        <span className="font-medium">{row.failed}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taux de livraison</span>
                        <span className="font-semibold text-primary">{row.delivery_rate}%</span>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${row.delivery_rate}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'settings' ? <ParametresCanaux /> : null}

      {showSend ? (
        <SendNotificationModal
          onClose={() => setShowSend(false)}
          onSuccess={() => {
            setShowSend(false);
            fetchLog();
          }}
        />
      ) : null}

      {showBroadcast ? (
        <BroadcastModal
          onClose={() => setShowBroadcast(false)}
          onSuccess={() => setShowBroadcast(false)}
        />
      ) : null}

      {editingTemplate ? (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={() => {
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      ) : null}

      {showClientPrefs && selectedClient ? (
        <ClientPreferencesModal
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          onClose={() => {
            setShowClientPrefs(false);
            setSelectedClient(null);
          }}
        />
      ) : null}

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onClick={() => setDetail(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Détail notification</h2>
              <button onClick={() => setDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              {[
                ['Type', detail.type],
                ['Canal', CHANNEL_LABELS[detail.channel]?.label],
                ['Destinataire', detail.recipient],
                ['Statut', detail.status],
                ['Envoyé', detail.sent_at ? readableDate(detail.sent_at) : '—'],
                ['Par', detail.sent_by_name || 'Système'],
                ['Client', detail.client_name || '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-28 flex-shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{val || '—'}</dd>
                </div>
              ))}

              {detail.subject ? (
                <div className="flex gap-3">
                  <dt className="w-28 flex-shrink-0 text-muted-foreground">Objet</dt>
                  <dd>{detail.subject}</dd>
                </div>
              ) : null}

              {detail.error_reason ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-xs font-medium text-destructive">Erreur</p>
                  <p className="mt-1 text-xs">{detail.error_reason}</p>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 space-y-3">
              {detail.client_id ? (
                <Button
                  variant="outline"
                  className="w-full rounded-2xl"
                  onClick={() => openClientPrefs(detail)}
                >
                  <UserCog size={14} />
                  Préférences client
                </Button>
              ) : null}

              {detail.status === 'failed' ? (
                <Button
                  className="w-full rounded-2xl"
                  onClick={async () => {
                    await api.post(`/notifications/${detail.id}/resend`);
                    setDetail(null);
                    fetchLog();
                  }}
                >
                  <RefreshCw size={14} />
                  Renvoyer
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ArrowUpRightFallback(props) {
  return <Send {...props} />;
}