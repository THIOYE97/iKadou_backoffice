import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { login, selectAuthLoading, selectAuthError, clearError } from '@/Redux/Auth/authSlice';
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
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    dispatch(clearError());
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'hsl(var(--sidebar-bg))' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
              <img
                src={favicon}
                alt="Ikadou favicon"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div className="flex flex-col">
              <img
                src={ikadouLogo}
                alt="Ikadou"
                className="h-10 w-auto object-contain"
              />
              <span className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">
                Backoffice
              </span>
            </div>
          </div>

          <div>
            <blockquote className="text-white/90 font-display text-2xl font-medium leading-relaxed mb-6">
              "Investir dans la terre, c&apos;est investir dans l&apos;avenir.
              <br />
              Le Mali vous attend."
            </blockquote>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
                <img
                  src={favicon}
                  alt="Ikadou"
                  className="h-5 w-5 object-contain"
                />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Backoffice Ikadou</p>
                <p className="text-white/50 text-xs">Gestion opérationnelle</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Terrains', value: '200+' },
              { label: 'Clients', value: '1 200+' },
              { label: 'Zones', value: '12' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-3"
                style={{ background: 'hsl(var(--sidebar-hover))' }}
              >
                <p className="text-primary font-display text-xl font-bold">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
              <img
                src={favicon}
                alt="Ikadou favicon"
                className="h-6 w-6 object-contain"
              />
            </div>
            <img
              src={ikadouLogo}
              alt="Ikadou"
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Connexion
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Accédez au backoffice Ikadou
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@ikadou.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accès réservé aux équipes internes Ikadou
          </p>
        </div>
      </div>
    </div>
  );
}