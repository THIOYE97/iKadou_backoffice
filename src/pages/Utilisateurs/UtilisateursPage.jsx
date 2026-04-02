import { useState, useEffect, useCallback } from 'react';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/Api/axiosInstance';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { USER_STATUS, ROLES } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';

function UserFormModal({ onClose, onSuccess, user }) {
  const isEdit = !!user;
  const [serverError, setServerError] = useState(null);

  const schema = isEdit
    ? z.object({ role: z.string(), status: z.string() })
    : z.object({
        firstName: z.string().min(1, 'Requis'),
        lastName:  z.string().min(1, 'Requis'),
        email:     z.string().email('Email invalide'),
        password:  z.string().min(8, '8 caractères min.'),
        role:      z.string().min(1, 'Requis'),
      });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: user ? { role: user.role, status: user.status } : {},
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (isEdit) {
        await api.patch(`/users/${user.id}`, { role: values.role, status: values.status });
      } else {
        await api.post('/users', values);
      }
      onSuccess();
    } catch (err) { setServerError(err.response?.data?.message || 'Erreur'); }
  };

  const selCls = 'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display font-semibold">{isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {serverError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{serverError}</p>}

          {!isEdit && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prénom *</Label>
                  <Input {...register('firstName')} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Nom *</Label>
                  <Input {...register('lastName')} />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Mot de passe *</Label>
                <Input type="password" placeholder="8 caractères min." {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Rôle *</Label>
            <select className={selCls} {...register('role')}>
              <option value="">— Sélectionner —</option>
              {Object.entries(ROLES).filter(([k]) => k !== 'super_admin').map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select className={selCls} {...register('status')}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: 'name', label: 'Utilisateur',
    render: (_, row) => (
      <div>
        <p className="font-medium text-sm">{row.first_name} {row.last_name}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    )},
  { key: 'role',   label: 'Rôle',   render: v => <StatusBadge map={ROLES} value={v} /> },
  { key: 'status', label: 'Statut', render: v => <StatusBadge map={USER_STATUS} value={v} /> },
  { key: 'last_login_at', label: 'Dernière connexion',
    render: v => <span className="text-xs text-muted-foreground">{v ? readableDate(v) : 'Jamais'}</span> },
  { key: 'created_at', label: 'Créé le',
    render: v => <span className="text-xs text-muted-foreground">{readableDate(v)}</span> },
];

export default function UtilisateursPage() {
  const [data, setData]         = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [filters, setFilters]   = useState({ search: '', role: '', status: '', page: 1, limit: 20 });

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const r = await api.get('/users', { params });
      setData(r.data.data); setMeta(r.data.meta);
    } catch { setError('Impossible de charger les utilisateurs'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const hasFilters = filters.search || filters.role || filters.status;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Utilisateurs internes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} utilisateur${meta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Nouvel utilisateur</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Nom, email…" className="pl-8 w-52"
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
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ search: '', role: '', status: '', page: 1, limit: 20 })}>
            <X size={14} /> Reset
          </Button>
        )}
      </div>

      <DataTable columns={COLUMNS} data={data} loading={loading} error={error}
        onRowClick={row => setEditing(row)} />
      <Pagination meta={meta} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />

      {(showForm || editing) && (
        <UserFormModal
          user={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); fetch(); }}
        />
      )}
    </div>
  );
}