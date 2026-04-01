import { useState, useEffect, useCallback } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { documentsApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { readableDate } from '@/Util/readableDate';

const TYPE_LABELS = {
  id_card: "Carte d'identité",
  passport: 'Passeport',
  proof_of_address: 'Justificatif domicile',
  title_deed: 'Titre foncier',
  survey_plan: 'Plan cadastral',
  payment_receipt: 'Reçu de paiement',
  contract: 'Contrat',
  other: 'Autre',
};

const RELATED_LABELS = {
  client: 'Client',
  terrain: 'Terrain',
  lead: 'Lead',
  payment: 'Paiement',
};

const COLUMNS = [
  {
    key: 'name',
    label: 'Nom du fichier',
    render: (v) => (
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium">{v}</span>
      </div>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    render: (v) => <Badge variant="outline">{TYPE_LABELS[v] || v}</Badge>,
  },
  {
    key: 'related_type',
    label: 'Lié à',
    render: (v) => (
      <span className="text-xs text-muted-foreground">
        {RELATED_LABELS[v] || v || '—'}
      </span>
    ),
  },
  {
    key: 'created_at',
    label: 'Ajouté le',
    render: (v) => <span className="text-muted-foreground text-xs">{readableDate(v)}</span>,
  },
  {
    key: 'url',
    label: '',
    render: (v) => (
      <a href={v} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm">
          <Download size={14} />
        </Button>
      </a>
    ),
  },
];

export default function DocumentsPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    related_type: '',
    related_id: '',
    type: '',
    page: 1,
    limit: 20,
  });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await documentsApi.list(params);
      setData(res.data);
      setMeta(res.meta);
    } catch {
      setError('Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const resetFilters = () =>
    setFilters({
      related_type: '',
      related_id: '',
      type: '',
      page: 1,
      limit: 20,
    });

  const hasFilters = filters.related_type || filters.related_id || filters.type;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {meta ? `${meta.total} document${meta.total > 1 ? 's' : ''}` : 'Chargement…'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.related_type}
          onChange={(e) => setFilters((f) => ({ ...f, related_type: e.target.value, page: 1 }))}
        >
          <option value="">Tous les liens</option>
          {Object.entries(RELATED_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <Input
          placeholder="ID lié…"
          className="w-56"
          value={filters.related_id}
          onChange={(e) => setFilters((f) => ({ ...f, related_id: e.target.value, page: 1 }))}
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X size={14} /> Réinitialiser
          </Button>
        )}
      </div>

      <DataTable columns={COLUMNS} data={data} loading={loading} error={error} />
      <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
    </div>
  );
}