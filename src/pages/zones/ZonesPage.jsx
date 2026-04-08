import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  MapPin,
  Sparkles,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Pencil,
  Search,
  RefreshCw,
} from 'lucide-react';
import { zonesApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ZoneFormModal from './ZoneFormModal';

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

export default function ZonesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  
  const openCreate = () => {
  setSelected(null);
  setModalOpen(true);
};

const openEdit = (row) => {
  setSelected(row);
  setModalOpen(true);
};

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
  try {
    setLoading(true);
    setError('');

    const res = await zonesApi.list();
    console.log('zones response =', res);
    console.log('zones response.data =', res?.data);

    setItems(
      Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : []
    );
  } catch (e) {
    console.error('zones error =', e);
    console.error('zones error response =', e?.response);
    setError(e?.response?.data?.message || 'Erreur de chargement des zones');
  } finally {
    setLoading(false);
  }
}
  async function handleSubmit(payload) {
    try {
      setSubmitLoading(true);

      if (selected?.id) {
        await zonesApi.update(selected.id, payload);
      } else {
        await zonesApi.create(payload);
      }

      setModalOpen(false);
      setSelected(null);
      await loadZones();
    } catch (e) {
      throw new Error(e?.response?.data?.message || 'Erreur lors de l’enregistrement');
    } finally {
      setSubmitLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((zone) => {
      const name = zone?.name?.toLowerCase() || '';
      const region = zone?.region?.toLowerCase() || '';
      const description = zone?.description?.toLowerCase() || '';
      return name.includes(q) || region.includes(q) || description.includes(q);
    });
  }, [items, search]);

  const totalTerrains = useMemo(
    () => items.reduce((sum, z) => sum + (Number(z?.terrain_count) || 0), 0),
    [items]
  );

  const totalAgents = useMemo(
    () => items.reduce((sum, z) => sum + (Number(z?.agent_count) || 0), 0),
    [items]
  );

  const columns = [
  {
    key: 'name',
    label: 'Nom',
    render: (value) => <span className="text-sm font-semibold">{value || '—'}</span>,
  },
  {
    key: 'region',
    label: 'Région',
    render: (value) => (
      <span className="text-sm text-muted-foreground">{value || '—'}</span>
    ),
  },
  {
    key: 'description',
    label: 'Description',
    render: (value) => (
      <span className="line-clamp-2 text-sm text-muted-foreground">
        {value || '—'}
      </span>
    ),
  },
  {
    key: 'terrain_count',
    label: 'Terrains',
    render: (value) => (
      <span className="text-sm font-medium">{value || 0}</span>
    ),
  },
  {
    key: 'agent_count',
    label: 'Agents',
    render: (value) => (
      <span className="text-sm font-medium">{value || 0}</span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (_value, row) => (
      <Button
        type="button"
        variant="outline"
        className="rounded-2xl"
        onClick={(e) => {
          e.stopPropagation();
          openEdit(row);
        }}
      >
        <Pencil size={14} />
        Modifier
      </Button>
    ),
  },
];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" />
              Administration territoriale
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Zones
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="h-11 rounded-2xl px-5 shadow-[0_12px_24px_hsl(var(--primary)/0.22)]"
          >
            <Plus size={16} />
            Nouvelle zone
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total zones"
          value={loading ? '...' : items.length}
          icon={MapPin}
          tone="primary"
        />
        <StatCard
          label="Terrains rattachés"
          value={loading ? '...' : totalTerrains}
          icon={ArrowUpRight}
          tone="violet"
        />
        <StatCard
          label="Agents rattachés"
          value={loading ? '...' : totalAgents}
          icon={ShieldCheck}
          tone="orange"
        />
        <StatCard
          label="Résultats affichés"
          value={loading ? '...' : filteredItems.length}
          icon={Filter}
          tone="emerald"
        />
      </section>

      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Recherche</h2>
            <p className="text-sm text-muted-foreground">
              Filtre par nom, région ou description
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nom, région, description..."
              className="h-11 w-72 rounded-2xl pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl"
            onClick={loadZones}
          >
            <RefreshCw size={14} />
            Actualiser
          </Button>

          {search ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-2xl"
              onClick={() => setSearch('')}
            >
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
          columns={columns}
          data={filteredItems}
          loading={loading}
          error={null}
          emptyMessage="Aucune zone trouvée"
        />
      </section>

      <ZoneFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onSubmit={handleSubmit}
        initialData={selected}
        loading={submitLoading}
      />
    </div>
  );
}