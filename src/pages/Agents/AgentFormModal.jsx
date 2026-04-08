import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Loader2,
  User2,
  Mail,
  Phone,
  MapPinned,
  Lock,
  Sparkles,
} from 'lucide-react';
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

  const selectCls =
    'flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="sticky top-0 flex items-center justify-between border-b bg-card/90 p-5 backdrop-blur">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Création agent
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold tracking-tight">
              Nouvel agent
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajouter un agent commercial et lui attribuer une zone
            </p>
          </div>

          <button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
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
              <Label>Prénom *</Label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-11 rounded-2xl pl-10" {...register('firstName')} />
              </div>
              {errors.firstName ? <p className="text-xs text-destructive">{errors.firstName.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-11 rounded-2xl pl-10" {...register('lastName')} />
              </div>
              {errors.lastName ? <p className="text-xs text-destructive">{errors.lastName.message}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" className="h-11 rounded-2xl pl-10" {...register('email')} />
              </div>
              {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-11 rounded-2xl pl-10" {...register('phone')} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Zone</Label>
              <div className="relative">
                <MapPinned className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select className={`${selectCls} pl-10`} {...register('zoneId')}>
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
              <Label>Statut</Label>
              <select className={selectCls} {...register('status')}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mot de passe *</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" className="h-11 rounded-2xl pl-10" {...register('password')} />
            </div>
            {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}