import { useEffect, useState } from 'react';
import { X, Loader2, MapPin, FileText, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        name: initialData.name || '',
        region: initialData.region || '',
        description: initialData.description || '',
      });
    } else {
      setForm(initialForm);
    }

    setErrors({});
    setServerError('');
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    setErrors((prev) => ({
      ...prev,
      [key]: '',
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Le nom est requis';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      await onSubmit({
        name: form.name.trim(),
        region: form.region.trim(),
        description: form.description.trim(),
      });
    } catch (err) {
      setServerError(err?.message || 'Erreur lors de l’enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/90 p-5 backdrop-blur">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {initialData ? 'Modifier la zone' : 'Nouvelle zone'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {initialData
                ? 'Mettez à jour les informations de la zone'
                : 'Créez une nouvelle zone commerciale ou géographique'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {serverError ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-2xl pl-10"
                placeholder="Zone Bamako Est"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Région</Label>
            <div className="relative">
              <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-2xl pl-10"
                placeholder="Bamako"
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                rows={5}
                className="min-h-[150px] w-full rounded-2xl border border-input bg-background px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Description de la zone, portée commerciale, secteurs couverts..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>

            <Button type="submit" className="rounded-2xl" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {initialData ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}