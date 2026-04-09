import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import {
  login,
  selectAuthLoading,
  selectAuthError,
  clearError,
} from '@/Redux/Auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import favicon from '@/Assets/favicon.png';
import ikadouLogo from '@/Assets/ikadou_logo.png';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values) => {
    dispatch(clearError());
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--surface-1)))] text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left side */}
        <section
          className="relative hidden overflow-hidden lg:flex"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(14,165,183,0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(255,107,0,0.16), transparent 30%), linear-gradient(180deg, #071521 0%, #0b1c2b 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                `url("data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="absolute left-10 top-10 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-[0_12px_30px_rgba(14,165,183,0.16)] backdrop-blur-sm">
                <img
                  src={favicon}
                  alt="Ikadou favicon"
                  className="h-8 w-8 object-contain"
                />
              </div>

              <div className="min-w-0">
                <img
                  src={ikadouLogo}
                  alt="Ikadou"
                  className="h-10 w-auto max-w-[180px] object-contain"
                />
                <div className="mt-1 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#ff6b00]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.20em] text-[#ff6b00]">
                    Backoffice 
                  </span>
                </div>
              </div>
            </div>

            {/* Main message */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
                Accès sécurisé aux équipes internes
              </div>

              <h2 className="mt-6 font-display text-4xl font-semibold leading-tight text-white xl:text-5xl">
                Gérez les opérations Ikadou
               
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-white/65 xl:text-base">
                Suivez les terrains, clients, paiements, visites, documents et
                support dans un backoffice conçu pour la performance opérationnelle.
              </p>

              <blockquote className="mt-8 border-l border-cyan-400/30 pl-4 text-lg font-medium leading-relaxed text-white/90">
                “Investir dans la terre, c&apos;est investir dans l&apos;avenir.
                <br />
                Le Mali vous attend.”
              </blockquote>
            </div>

            {/* Bottom stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Terrains', value: '200+' },
                { label: 'Clients', value: '1 200+' },
                { label: 'Zones', value: '12' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center backdrop-blur-sm"
                >
                  <p className="font-display text-2xl font-bold text-cyan-300">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right side */}
        <section className="relative flex items-center justify-center px-6 py-10 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.10),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,107,0,0.08),transparent_24%)]" />

          <div className="relative z-10 w-full max-w-md animate-fade-in">
            {/* Mobile brand */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10">
                <img
                  src={favicon}
                  alt="Ikadou favicon"
                  className="h-6 w-6 object-contain"
                />
              </div>

              <div>
                <img
                  src={ikadouLogo}
                  alt="Ikadou"
                  className="h-8 w-auto object-contain"
                />
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                  Backoffice
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur xl:p-8">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Connexion sécurisée
                </div>

                <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">
                  Connexion
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Accédez au backoffice Ikadou avec vos identifiants internes.
                </p>
              </div>

              {error ? (
                <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@ikadou.com"
                    autoComplete="email"
                    className="h-11 rounded-2xl"
                    {...register('email')}
                  />
                  {errors.email ? (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="h-11 rounded-2xl pr-11"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-2xl shadow-[0_12px_24px_hsl(var(--primary)/0.22)]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>

              <div className="mt-6 border-t pt-5">
                <p className="text-center text-xs text-muted-foreground">
                  Accès réservé aux équipes internes Ikadou
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
