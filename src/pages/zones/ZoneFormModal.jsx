import { useEffect, useState } from 'react';

const initialForm = {
  name: '',
  region: '',
  description: '',
};

export default function ZoneFormModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        region: initialData.region || '',
        description: initialData.description || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f172a] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {initialData ? 'Modifier la zone' : 'Créer une zone'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Nom *</label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Région</label>
            <input
              value={form.region}
              onChange={(e) => handleChange('region', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}