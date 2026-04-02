import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Upload, Download, FileText, Loader2, Trash2 } from 'lucide-react';
import api from '@/Api/axiosInstance';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { readableDate } from '@/Util/readableDate';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const TYPE_LABELS = {
  id_card: "Carte d'identité", passport: 'Passeport',
  proof_of_address: 'Justif. domicile', title_deed: 'Titre foncier',
  survey_plan: 'Plan cadastral', payment_receipt: 'Reçu paiement',
  contract: 'Contrat', other: 'Autre',
};

const MIME_ICONS = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️', 'image/png': '🖼️', 'image/webp': '🖼️',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
};

function UploadModal({ onClose, onSuccess }) {
  const [file, setFile]           = useState(null);
  const [relatedType, setRelatedType] = useState('client');
  const [relatedId, setRelatedId] = useState('');
  const [type, setType]           = useState('other');
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);
  const inputRef = useRef();

  const handleUpload = async () => {
    if (!file || !relatedId.trim()) { setError('Fichier et ID de référence requis'); return; }
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('relatedType', relatedType);
      fd.append('relatedId', relatedId.trim());
      fd.append('type', type);
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess();
    } catch (err) { setError(err.response?.data?.message || 'Erreur upload'); }
    finally { setUploading(false); }
  };

  const selCls = 'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display font-semibold">Ajouter un document</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          {/* File picker */}
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/30"
            onClick={() => inputRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{MIME_ICONS[file.type] || '📎'}</span>
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Cliquer pour choisir un fichier</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, Word — max 20 MB</p>
              </>
            )}
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={e => setFile(e.target.files[0])} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Lié à</label>
              <select className={selCls} value={relatedType} onChange={e => setRelatedType(e.target.value)}>
                <option value="client">Client</option>
                <option value="terrain">Terrain</option>
                <option value="lead">Lead</option>
                <option value="payment">Paiement</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <select className={selCls} value={type} onChange={e => setType(e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">ID de référence (UUID) *</label>
            <Input placeholder="UUID du client, terrain, lead ou paiement" value={relatedId} onChange={e => setRelatedId(e.target.value)} className="font-mono text-xs" />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleUpload} disabled={uploading || !file}>
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
  { key: 'name', label: 'Document',
    render: (v, row) => (
      <div className="flex items-center gap-2">
        <span className="text-lg">{MIME_ICONS[row.mime_type] || '📎'}</span>
        <div>
          <p className="text-sm font-medium">{v}</p>
          <p className="text-xs text-muted-foreground">{row.original_name}</p>
        </div>
      </div>
    )},
  { key: 'type', label: 'Type',
    render: v => <Badge variant="outline" className="text-xs">{TYPE_LABELS[v] || v}</Badge> },
  { key: 'related_type', label: 'Lié à',
    render: (v, row) => (
      <div>
        <span className="text-xs capitalize font-medium">{v}</span>
        <p className="text-[10px] text-muted-foreground font-mono">{row.related_id?.substring(0, 8)}…</p>
      </div>
    )},
  { key: 'size_bytes', label: 'Taille',
    render: v => v ? <span className="text-xs text-muted-foreground">{(v / 1024).toFixed(0)} KB</span> : '—' },
  { key: 'uploaded_by_name', label: 'Ajouté par',
    render: v => <span className="text-xs text-muted-foreground">{v || 'Système'}</span> },
  { key: 'created_at', label: 'Date',
    render: v => <span className="text-xs text-muted-foreground">{readableDate(v)}</span> },
  { key: 'url', label: '',
    render: (v) => (
      <a href={`${BACKEND}${v}`} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        onClick={e => e.stopPropagation()}>
        <Download size={12} /> Ouvrir
      </a>
    )},
];

export default function DocumentsPage() {
  const [data, setData]         = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters]   = useState({ search: '', type: '', related_type: '', page: 1, limit: 20 });

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const r = await api.get('/documents', { params });
      setData(r.data.data); setMeta(r.data.meta);
    } catch { setError('Impossible de charger les documents'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const hasFilters = filters.search || filters.type || filters.related_type;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Documents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} document${meta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}><Upload size={16} /> Ajouter</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Nom du document…" className="pl-8 w-52"
            value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.related_type} onChange={e => setFilters(f => ({ ...f, related_type: e.target.value, page: 1 }))}>
          <option value="">Tous</option>
          <option value="client">Clients</option>
          <option value="terrain">Terrains</option>
          <option value="lead">Leads</option>
          <option value="payment">Paiements</option>
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ search: '', type: '', related_type: '', page: 1, limit: 20 })}>
            <X size={14} /> Reset
          </Button>
        )}
      </div>

      <DataTable columns={COLUMNS} data={data} loading={loading} error={error} />
      <Pagination meta={meta} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); fetch(); }} />}
    </div>
  );
}