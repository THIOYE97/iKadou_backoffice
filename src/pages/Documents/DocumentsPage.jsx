import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  X,
  Upload,
  Download,
  FileText,
  Loader2,
  Sparkles,
  FolderOpen,
  Filter,
  ArrowUpRight,
  Link2,
} from 'lucide-react';
import api from '@/Api/axiosInstance';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { readableDate } from '@/Util/readableDate';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const TYPE_LABELS = {
  id_card: "Carte d'identité",
  passport: 'Passeport',
  proof_of_address: 'Justif. domicile',
  title_deed: 'Titre foncier',
  survey_plan: 'Plan cadastral',
  payment_receipt: 'Reçu paiement',
  contract: 'Contrat',
  other: 'Autre',
};

const MIME_ICONS = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/webp': '🖼️',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
};

function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [relatedType, setRelatedType] = useState('client');
  const [relatedId, setRelatedId] = useState('');
  const [type, setType] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleUpload = async () => {
    if (!file || !relatedId.trim()) {
      setError('Fichier et ID de référence requis');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('relatedType', relatedType);
      fd.append('relatedId', relatedId.trim());
      fd.append('type', type);

      await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const selCls =
    'flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl animate-fade-in rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Ajouter un document
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Téléverse un document lié à un client, terrain, lead ou paiement
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {error ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div
            className="cursor-pointer rounded-[24px] border-2 border-dashed p-6 text-center transition hover:bg-muted/20"
            onClick={() => inputRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">{MIME_ICONS[file.type] || '📎'}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Cliquer pour choisir un fichier</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, JPG, PNG, WebP, Word — max 20 MB
                </p>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Lié à</label>
              <select
                className={selCls}
                value={relatedType}
                onChange={(e) => setRelatedType(e.target.value)}
              >
                <option value="client">Client</option>
                <option value="terrain">Terrain</option>
                <option value="lead">Lead</option>
                <option value="payment">Paiement</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <select
                className={selCls}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">ID de référence (UUID) *</label>
            <Input
              className="h-11 rounded-2xl font-mono text-xs"
              placeholder="UUID du client, terrain, lead ou paiement"
              value={relatedId}
              onChange={(e) => setRelatedId(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>
            <Button className="rounded-2xl" onClick={handleUpload} disabled={uploading || !file}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Upload…' : 'Uploader'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const COLUMNS = [
  {
    key: 'name',
    label: 'Document',
    render: (v, row) => (
      <div className="flex items-center gap-3">
        <span className="text-lg">{MIME_ICONS[row.mime_type] || '📎'}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{v}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original_name}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    render: (v) => (
      <Badge variant="outline" className="text-xs">
        {TYPE_LABELS[v] || v}
      </Badge>
    ),
  },
  {
    key: 'related_type',
    label: 'Lié à',
    render: (v, row) => (
      <div>
        <span className="text-xs font-medium capitalize">{v}</span>
        <p className="font-mono text-[10px] text-muted-foreground">
          {row.related_id?.substring(0, 8)}…
        </p>
      </div>
    ),
  },
  {
    key: 'size_bytes',
    label: 'Taille',
    render: (v) =>
      v ? (
        <span className="text-xs text-muted-foreground">{(v / 1024).toFixed(0)} KB</span>
      ) : (
        '—'
      ),
  },
  {
    key: 'uploaded_by_name',
    label: 'Ajouté par',
    render: (v) => <span className="text-xs text-muted-foreground">{v || 'Système'}</span>,
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (v) => <span className="text-xs text-muted-foreground">{readableDate(v)}</span>,
  },
  {
    key: 'url',
    label: '',
    render: (v) => (
      <a
        href={`${BACKEND}${v}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        <Download size={12} />
        Ouvrir
      </a>
    ),
  },
];

function StatCard({ label, value, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  };

  return (
    <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone] || tones.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    related_type: '',
    page: 1,
    limit: 20,
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const r = await api.get('/documents', { params });
      setData(r.data.data);
      setMeta(r.data.meta);
    } catch {
      setError('Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const hasFilters = filters.search || filters.type || filters.related_type;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <FolderOpen className="h-3.5 w-3.5" />
              Bibliothèque documentaire
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Documents
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
             
            </p>
          </div>

          <Button
            onClick={() => setShowUpload(true)}
            className="h-11 rounded-2xl px-5 shadow-[0_12px_24px_hsl(var(--primary)/0.22)]"
          >
            <Upload size={16} />
            Ajouter
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total documents"
          value={loading ? '...' : meta?.total ?? 0}
          icon={FolderOpen}
          tone="primary"
        />
        <StatCard
          label="Page actuelle"
          value={loading ? '...' : filters.page}
          icon={ArrowUpRight}
          tone="violet"
        />
        <StatCard
          label="Par page"
          value={filters.limit}
          icon={FileText}
          tone="orange"
        />
        <StatCard
          label="Filtres actifs"
          value={hasFilters ? 'Oui' : 'Non'}
          icon={Link2}
          tone="emerald"
        />
      </section>

      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Filtres</h2>
            <p className="text-sm text-muted-foreground">
              Recherche par nom, type ou entité liée
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nom du document…"
              className="h-11 w-56 rounded-2xl pl-8"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>

          <select
            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
          >
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <select
            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
            value={filters.related_type}
            onChange={(e) => setFilters((f) => ({ ...f, related_type: e.target.value, page: 1 }))}
          >
            <option value="">Tous</option>
            <option value="client">Clients</option>
            <option value="terrain">Terrains</option>
            <option value="lead">Leads</option>
            <option value="payment">Paiements</option>
          </select>

          {hasFilters ? (
            <Button
              variant="ghost"
              className="h-11 rounded-2xl"
              onClick={() =>
                setFilters({
                  search: '',
                  type: '',
                  related_type: '',
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

        <DataTable columns={COLUMNS} data={data} loading={loading} error={null} />
      </section>

      <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
        <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </div>

      {showUpload ? (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            fetch();
          }}
        />
      ) : null}
    </div>
  );
}