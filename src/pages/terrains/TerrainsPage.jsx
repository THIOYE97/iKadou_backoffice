import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Plus } from 'lucide-react';
import { terrainsApi, zonesApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TERRAIN_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';
import TerrainFormModal from './TerrainFormModal';

const formatPrice = (price, currency) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'XOF', maximumFractionDigits: 0 }).format(price);

const COLUMNS = [
  { key: 'ref', label: 'Réf.',
    render: (v) => <span className="font-mono text-xs font-semibold text-primary">{v}</span> },
  { key: 'title', label: 'Titre',
    render: (v) => <span className="font-medium">{v}</span> },
  { key: 'price', label: 'Prix',
    render: (v, row) => formatPrice(v, row.currency) },
  { key: 'surface_m2', label: 'Surface',
    render: (v) => v ? `${v} m²` : '—' },
  { key: 'zone_name', label: 'Zone',
    render: (v) => <span className="text-muted-foreground text-xs">{v || '—'}</span> },
  { key: 'status', label: 'Statut',
    render: (v) => <StatusBadge map={TERRAIN_STATUS} value={v} /> },
  { key: 'created_at', label: 'Créé le',
    render: (v) => <span className="text-muted-foreground text-xs">{readableDate(v)}</span> },
];

export default function TerrainsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zones, setZones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', zone_id: '', page: 1, limit: 20 });

  useEffect(() => {
    zonesApi.list().then((r) => setZones(r.data)).catch(() => {});
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const res = await terrainsApi.list(params);
      setData(res.data); setMeta(res.meta);
    } catch { setError('Impossible de charger les terrains'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const hasFilters = filters.search || filters.status || filters.zone_id;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Terrains</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} terrain${meta.total > 1 ? 's' : ''}` : 'Chargement…'}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nouveau terrain
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Titre, référence, localisation…" className="pl-8 w-64"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))} />
        </div>

        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-ring"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">Tous les statuts</option>
          {Object.entries(TERRAIN_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-ring"
          value={filters.zone_id}
          onChange={(e) => setFilters((f) => ({ ...f, zone_id: e.target.value, page: 1 }))}>
          <option value="">Toutes les zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ search: '', status: '', zone_id: '', page: 1, limit: 20 })}>
            <X size={14} /> Réinitialiser
          </Button>
        )}
      </div>

      <DataTable columns={COLUMNS} data={data} loading={loading} error={error}
        onRowClick={(row) => navigate(`/terrains/${row.id}`)} />
      <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />

      {showForm && (
        <TerrainFormModal zones={zones} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); fetch(); }} />
      )}
    </div>
  );
}
