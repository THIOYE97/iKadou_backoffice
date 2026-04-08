import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, MapPinned, Wallet, Ruler, FileText } from 'lucide-react';
import { terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  ref: z.string().min(1, 'Référence requise'),
  title: z.string().min(1, 'Titre requis'),
  price: z.coerce.number().positive('Prix invalide'),
  currency: z.string().default('XOF'),
  surfaceM2: z.coerce.number().optional(),
  location: z.string().optional(),
  zoneId: z.string().optional(),
  status: z.string().default('draft'),
});

export default function TerrainFormModal({ zones = [], onClose, onSuccess, terrain }) {
  const [serverError, setServerError] = useState(null);
  const isEdit = !!terrain;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: terrain
      ? {
          ref: terrain.ref,
          title: terrain.title,
          price: terrain.price,
          currency: terrain.currency,
          surfaceM2: terrain.surface_m2,
          location: terrain.location,
          zoneId: terrain.zone_id,
          status: terrain.status,
        }
      : { currency: 'XOF', status: 'draft' },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const payload = {
        ...values,
        surfaceM2: values.surfaceM2 || null,
        location: values.location || null,
        zoneId: values.zoneId || null,
      };

      if (isEdit) await terrainsApi.update(terrain.id, payload);
      else await terrainsApi.create(payload);

      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/90 p-5 backdrop-blur">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier le terrain' : 'Nouveau terrain'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Renseigne les informations principales du terrain
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
          {serverError ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Référence *</Label>
              <Input className="h-11 rounded-2xl" placeholder="IKD-001" {...register('ref')} />
              {errors.ref ? <p className="text-xs text-destructive">{errors.ref.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                {...register('status')}
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Titre *</Label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-2xl pl-10"
                placeholder="Terrain résidentiel Bamako Nord"
                {...register('title')}
              />
            </div>
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Prix *</Label>
              <div className="relative">
                <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  className="h-11 rounded-2xl pl-10"
                  placeholder="15000000"
                  {...register('price')}
                />
              </div>
              {errors.price ? <p className="text-xs text-destructive">{errors.price.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Devise</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                {...register('currency')}
              >
                <option value="XOF">XOF (FCFA)</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Surface (m²)</Label>
              <div className="relative">
                <Ruler className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  className="h-11 rounded-2xl pl-10"
                  placeholder="500"
                  {...register('surfaceM2')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Zone</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                {...register('zoneId')}
              >
                <option value="">— Sélectionner —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Localisation</Label>
            <div className="relative">
              <MapPinned className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-2xl pl-10"
                placeholder="Quartier Boulkassoumbougou, Bamako"
                {...register('location')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}