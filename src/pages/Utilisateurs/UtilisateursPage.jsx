import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import api from '@/Api/axiosInstance';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { USER_STATUS, ROLES } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';
import UserFormModal from './UserForModal';

const COLUMNS = [
  { key: 'name', label: 'Utilisateur',
    render: (_, row) => (
      <div>
        <p className="font-medium text-sm">{row.first_name} {row.last_name}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    )},
  { key: 'role', label: 'Rôle', render: v => <StatusBadge map={ROLES} value={v} /> },
  { key: 'status', label: 'Statut', render: v => <StatusBadge map={USER_STATUS} value={v} /> },
  { key: 'last_login_at', label: 'Dernière connexion',
    render: v => <span className="text-xs text-muted-foreground">{v ? readableDate(v) : 'Jamais'}</span> },
  { key: 'created_at', label: 'Créé le', render: v => <span className="text-xs text-muted-foreground">{readableDate(v)}</span> },
];

export default function UtilisateursPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1, limit: 20 });

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''));
      const r = await api.get('/users', { params });
      setData(r.data.data); setMeta(r.data.meta);
    } catch { setError('Impossible de charger les utilisateurs'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Utilisateurs internes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{meta ? `${meta.total} utilisateur${meta.total > 1 ? 's' : ''}` : '…'}</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Nouvel utilisateur</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Nom, email…" className="pl-8 w-56"
            value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value, page: 1 }))}>
          <option value="">Tous les rôles</option>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">Tous les statuts</option>
          {Object.entries(USER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {(filters.search || filters.role || filters.status) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ search: '', role: '', status: '', page: 1, limit: 20 })}><X size={14} /> Reset</Button>
        )}
      </div>

      <DataTable columns={COLUMNS} data={data} loading={loading} error={error} />
      <Pagination meta={meta} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />

      {showForm && <UserFormModal onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); fetch(); }} />}
    </div>
  );
}