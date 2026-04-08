import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Loader2,
  User2,
  Mail,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import api from '@/Api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLES } from '@/Util/statusConfig';

export default function UserFormModal({ onClose, onSuccess, user }) {
  const isEdit = !!user;
  const [serverError, setServerError] = useState(null);

  const schema = isEdit
    ? z.object({
        role: z.string().min(1, 'Requis'),
        status: z.string().min(1, 'Requis'),
      })
    : z.object({
        firstName: z.string().min(1, 'Requis'),
        lastName: z.string().min(1, 'Requis'),
        email: z.string().email('Email invalide'),
        password: z.string().min(8, '8 caractères minimum'),
        role: z.string().min(1, 'Requis'),
      });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: user
      ? { role: user.role, status: user.status }
      : {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: '',
        },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (isEdit) {
        await api.patch(`/users/${user.id}`, {
          role: values.role,
          status: values.status,
        });
      } else {
        await api.post('/users', values);
      }
      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Erreur');
    }
  };

  const selectCls =
    'flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/90 p-5 backdrop-blur">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Administration
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold tracking-tight">
              {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur interne'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? 'Mettre à jour le rôle et le statut'
                : 'Créer un nouveau compte interne'}
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

          {!isEdit ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Prénom *</Label>
                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-11 rounded-2xl pl-10" {...register('firstName')} />
                  </div>
                  {errors.firstName ? (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label>Nom *</Label>
                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-11 rounded-2xl pl-10" {...register('lastName')} />
                  </div>
                  {errors.lastName ? (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Email *</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" className="h-11 rounded-2xl pl-10" {...register('email')} />
                </div>
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Mot de passe *</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="8 caractères minimum"
                    className="h-11 rounded-2xl pl-10"
                    {...register('password')}
                  />
                </div>
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label>Rôle *</Label>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select className={`${selectCls} pl-10`} {...register('role')}>
                <option value="">— Sélectionner —</option>
                {Object.entries(ROLES)
                  .filter(([k]) => k !== 'super_admin')
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
              </select>
            </div>
            {errors.role ? (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            ) : null}
          </div>

          {isEdit ? (
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select className={selectCls} {...register('status')}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          ) : null}

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