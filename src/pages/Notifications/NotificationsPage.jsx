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
  ChevronRight,
  CheckCircle,
  XCircle,
  Settings,
  UserCog,
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
  email: { label: 'Email', color: 'bg-blue-100 text-blue-800' },
  sms: { label: 'SMS', color: 'bg-green-100 text-green-800' },
  whatsapp: { label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-800' },
  push: { label: 'Push', color: 'bg-violet-100 text-violet-800' },
  in_app: { label: 'In-App', color: 'bg-gray-100 text-gray-800' },
};

const TABS = [
  { key: 'journal', label: 'Journal', icon: Bell },
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'stats', label: 'Statistiques', icon: BarChart2 },
  { key: 'settings', label: 'Paramètres', icon: Settings },
];

const COLUMNS = [
  {
    key: 'type',
    label: 'Type',
    render: v => (
      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
        {v}
      </span>
    ),
  },
  {
    key: 'channel',
    label: 'Canal',
    render: v => {
      const c = CHANNEL_LABELS[v] || { label: v, color: 'bg-gray-100 text-gray-800' };
      return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.color}`}>
          {c.label}
        </span>
      );
    },
  },
  {
    key: 'recipient',
    label: 'Destinataire',
    render: v => <span className="text-sm">{v}</span>,
  },
  {
    key: 'status',
    label: 'Statut',
    render: v => <StatusBadge map={NOTIF_STATUS} value={v} />,
  },
  {
    key: 'error_reason',
    label: 'Erreur',
    render: v =>
      v ? (
        <span className="text-xs text-destructive truncate max-w-[140px] block">
          {v}
        </span>
      ) : (
        '—'
      ),
  },
  {
    key: 'created_at',
    label: 'Envoyé',
    render: v => (
      <span className="text-xs text-muted-foreground">{readableTimestamp(v)}</span>
    ),
  },
  {
    key: 'actions',
    label: '',
    render: (_, row) => (row.status === 'failed' ? <ResendBtn id={row.id} /> : null),
  },
];

function ResendBtn({ id }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const resend = async e => {
    e.stopPropagation();
    setLoading(true);
    try {
      await api.post(`/notifications/${id}/resend`);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) return <span className="text-xs text-emerald-600">Renvoyé</span>;

  return (
    <Button size="sm" variant="outline" onClick={resend} disabled={loading}>
      {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      Renvoyer
    </Button>
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

  const openClientPrefs = row => {
    if (!row?.client_id) return;
    setSelectedClient({
      id: row.client_id,
      name: row.client_name || row.recipient || 'Client',
    });
    setShowClientPrefs(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Email · SMS · WhatsApp · Push
          </p>
        </div>

        {tab !== 'settings' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBroadcast(true)}>
              <Send size={15} /> Broadcast
            </Button>
            <Button onClick={() => setShowSend(true)}>
              <Plus size={15} /> Envoyer
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* JOURNAL */}
      {tab === 'journal' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Destinataire, type…"
                className="pl-8 w-56"
                value={filters.search}
                onChange={e =>
                  setFilters(f => ({ ...f, search: e.target.value, page: 1 }))
                }
              />
            </div>

            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.status}
              onChange={e =>
                setFilters(f => ({ ...f, status: e.target.value, page: 1 }))
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
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.channel}
              onChange={e =>
                setFilters(f => ({ ...f, channel: e.target.value, page: 1 }))
              }
            >
              <option value="">Tous les canaux</option>
              {Object.keys(CHANNEL_LABELS).map(k => (
                <option key={k} value={k}>
                  {CHANNEL_LABELS[k].label}
                </option>
              ))}
            </select>

            {(filters.search || filters.status || filters.channel) && (
              <Button
                variant="ghost"
                size="sm"
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
                <X size={14} /> Reset
              </Button>
            )}
          </div>

          <DataTable
            columns={COLUMNS}
            data={data}
            loading={loading}
            error={error}
            onRowClick={row => setDetail(row)}
          />

          <Pagination
            meta={meta}
            onPageChange={p => setFilters(f => ({ ...f, page: p }))}
          />
        </div>
      )}

      {/* TEMPLATES */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!templates.length && (
            <p className="text-muted-foreground text-sm col-span-3">
              Aucun template trouvé.
            </p>
          )}

          {templates.map(t => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setEditingTemplate(t)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      CHANNEL_LABELS[t.channel]?.color
                    }`}
                  >
                    {CHANNEL_LABELS[t.channel]?.label || t.channel}
                  </span>
                  <Badge variant={t.is_active ? 'success' : 'outline'}>
                    {t.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <CardTitle className="text-sm mt-2">{t.name}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-xs text-muted-foreground font-mono">{t.type}</p>

                {t.subject && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Objet: {t.subject}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {t.content}
                </p>

                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <ChevronRight size={12} /> Modifier
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* STATS */}
      {tab === 'stats' && (
        <div className="space-y-5">
          <div className="flex gap-2 justify-end">
            {['7d', '30d', '3m'].map(p => (
              <button
                key={p}
                onClick={() => fetchStats()}
                className="px-3 py-1.5 rounded-md text-xs border hover:bg-muted"
              >
                {p}
              </button>
            ))}
          </div>

          {!stats ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map(row => (
                <Card key={row.channel}>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          CHANNEL_LABELS[row.channel]?.color || 'bg-muted'
                        }`}
                      >
                        {CHANNEL_LABELS[row.channel]?.label || row.channel}
                      </span>
                      <span className="text-2xl font-display font-bold">
                        {row.total}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-500" />
                          Envoyés
                        </span>
                        <span className="font-medium">{row.sent}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <XCircle size={12} className="text-destructive" />
                          Échoués
                        </span>
                        <span className="font-medium">{row.failed}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taux de livraison</span>
                        <span className="font-semibold text-primary">
                          {row.delivery_rate}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${row.delivery_rate}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && <ParametresCanaux />}

      {/* Modals */}
      {showSend && (
        <SendNotificationModal
          onClose={() => setShowSend(false)}
          onSuccess={() => {
            setShowSend(false);
            fetchLog();
          }}
        />
      )}

      {showBroadcast && (
        <BroadcastModal
          onClose={() => setShowBroadcast(false)}
          onSuccess={() => setShowBroadcast(false)}
        />
      )}

      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={() => {
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      )}

      {showClientPrefs && selectedClient && (
        <ClientPreferencesModal
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          onClose={() => {
            setShowClientPrefs(false);
            setSelectedClient(null);
          }}
        />
      )}

      {/* Detail drawer */}
      {detail && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex justify-end"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-card w-full max-w-md h-full overflow-y-auto p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold">Détail notification</h2>
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
                  <dt className="text-muted-foreground w-28 flex-shrink-0">{label}</dt>
                  <dd className="font-medium">{val || '—'}</dd>
                </div>
              ))}
              {detail.subject && (
                <div className="flex gap-3">
                  <dt className="text-muted-foreground w-28 flex-shrink-0">Objet</dt>
                  <dd>{detail.subject}</dd>
                </div>
              )}
              {detail.error_reason && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-xs font-medium text-destructive">Erreur</p>
                  <p className="text-xs mt-1">{detail.error_reason}</p>
                </div>
              )}
            </dl>

            <div className="mt-6 space-y-3">
              {detail.client_id && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openClientPrefs(detail)}
                >
                  <UserCog size={14} /> Préférences client
                </Button>
              )}

              {detail.status === 'failed' && (
                <Button
                  className="w-full"
                  onClick={async () => {
                    await api.post(`/notifications/${detail.id}/resend`);
                    setDetail(null);
                    fetchLog();
                  }}
                >
                  <RefreshCw size={14} /> Renvoyer
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}