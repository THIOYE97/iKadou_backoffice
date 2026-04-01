import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { zonesApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import ZoneFormModal from './ZoneFormModal';

export default function ZonesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
    try {
      setLoading(true);
      setError('');
      const res = await zonesApi.list();
      setItems(res?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur de chargement des zones');
    } finally {
      setLoading(false);
    }
  }

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setModalOpen(true);
  };

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
      alert(e?.response?.data?.message || 'Erreur lors de l’enregistrement');
    } finally {
      setSubmitLoading(false);
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Nom',
      render: (row) => <span className="font-medium text-white">{row.name}</span>,
    },
    {
      key: 'region',
      title: 'Région',
      render: (row) => <span className="text-slate-300">{row.region || '-'}</span>,
    },
    {
      key: 'description',
      title: 'Description',
      render: (row) => (
        <span className="text-slate-400">
          {row.description ? row.description : '-'}
        </span>
      ),
    },
    {
      key: 'terrain_count',
      title: 'Terrains',
      render: (row) => <span className="text-slate-200">{row.terrain_count || 0}</span>,
    },
    {
      key: 'agent_count',
      title: 'Agents',
      render: (row) => <span className="text-slate-200">{row.agent_count || 0}</span>,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <button
          onClick={() => openEdit(row)}
          className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-slate-800"
        >
          <Pencil size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Zones</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestion des zones commerciales et géographiques
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
        >
          <Plus size={18} />
          Nouvelle zone
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage="Aucune zone trouvée"
        />
      </div>

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