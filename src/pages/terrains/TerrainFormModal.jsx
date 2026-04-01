import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  ref:       z.string().min(1, 'Référence requise'),
  title:     z.string().min(1, 'Titre requis'),
  price:     z.coerce.number().positive('Prix invalide'),
  currency:  z.string().default('XOF'),
  surfaceM2: z.coerce.number().optional(),
  location:  z.string().optional(),
  zoneId:    z.string().optional(),
  status:    z.string().default('draft'),
});

export default function TerrainFormModal({ zones = [], onClose, onSuccess, terrain }) {
  const [serverError, setServerError] = useState(null);
  const isEdit = !!terrain;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: terrain ? {
      ref: terrain.ref, title: terrain.title, price: terrain.price,
      currency: terrain.currency, surfaceM2: terrain.surface_m2,
      location: terrain.location, zoneId: terrain.zone_id, status: terrain.status,
    } : { currency: 'XOF', status: 'draft' },
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card">
          <h2 className="font-display font-semibold">{isEdit ? 'Modifier le terrain' : 'Nouveau terrain'}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {serverError && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{serverError}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Référence *</Label>
              <Input placeholder="IKD-001" {...register('ref')} />
              {errors.ref && <p className="text-xs text-destructive">{errors.ref.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('status')}>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Titre *</Label>
            <Input placeholder="Terrain résidentiel Bamako Nord" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prix *</Label>
              <Input type="number" placeholder="15000000" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Devise</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('currency')}>
                <option value="XOF">XOF (FCFA)</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Surface (m²)</Label>
              <Input type="number" placeholder="500" {...register('surfaceM2')} />
            </div>
            <div className="space-y-1.5">
              <Label>Zone</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('zoneId')}>
                <option value="">— Sélectionner —</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Localisation</Label>
            <Input placeholder="Quartier Boulkassoumbougou, Bamako" {...register('location')} />
          </div>

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
