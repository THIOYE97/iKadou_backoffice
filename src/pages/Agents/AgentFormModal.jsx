import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { agentsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  zoneId: z.string().optional(),
  status: z.string().default('active'),
  password: z.string().min(6, 'Mot de passe requis (6 caractères minimum)'),
});

export default function AgentFormModal({ zones = [], onClose, onSuccess }) {
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      zoneId: '',
      status: 'active',
      password: '',
    },
  });

const onSubmit = async (values) => {
  setServerError(null);

  try {
    const createdAgent = await agentsApi.create({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || null,
      zoneId: values.zoneId || null,
      status: values.status || 'active',
      password: values.password,
    });

    onSuccess?.(createdAgent);
    onClose?.();
  } catch (err) {
    setServerError(err?.response?.data?.message || 'Erreur');
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card shadow-xl animate-fade-in">
        <div className="sticky top-0 flex items-center justify-between border-b bg-card p-5">
          <h2 className="font-display font-semibold">Nouvel agent</h2>
          <button type="button" onClick={onClose}>
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input {...register('phone')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Zone</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
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

            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                {...register('status')}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mot de passe *</Label>
            <Input type="password" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="mr-2 animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}