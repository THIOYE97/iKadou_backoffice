import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { leadsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName:  z.string().min(1, 'Nom requis'),
  phone:     z.string().optional(),
  email:     z.string().email('Email invalide').optional().or(z.literal('')),
  country:   z.string().optional(),
  source:    z.string().min(1, 'Source requise'),
});

export default function LeadFormModal({ onClose, onSuccess, lead }) {
  const [serverError, setServerError] = useState(null);
  const isEdit = !!lead;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: lead ? {
      firstName: lead.first_name,
      lastName:  lead.last_name,
      phone:     lead.phone || '',
      email:     lead.email || '',
      country:   lead.country || '',
      source:    lead.source,
    } : { source: 'other' },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (isEdit) {
        await leadsApi.update(lead.id, values);
      } else {
        await leadsApi.create(values);
      }
      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display font-semibold">
            {isEdit ? 'Modifier le lead' : 'Nouveau lead'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {serverError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input placeholder="Moussa" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input placeholder="Diallo" {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input placeholder="+223 70 00 00 00" {...register('phone')} />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="moussa@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Pays</Label>
            <Input placeholder="France" {...register('country')} />
          </div>

          <div className="space-y-1.5">
            <Label>Source *</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-1 focus:ring-ring" {...register('source')}>
              <option value="other">Autre</option>
              <option value="landing_page">Landing page</option>
              <option value="mobile_app">App mobile</option>
              <option value="referral">Parrainage</option>
              <option value="social_media">Réseaux sociaux</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Téléphone</option>
              <option value="email">Email</option>
              <option value="agent">Agent</option>
            </select>
            {errors.source && <p className="text-xs text-destructive">{errors.source.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer le lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}