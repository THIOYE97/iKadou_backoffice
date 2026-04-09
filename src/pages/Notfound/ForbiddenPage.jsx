import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, ArrowLeft, Lock } from 'lucide-react';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--surface-1)))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.10),transparent_22%)]" />
      <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="overflow-hidden rounded-[36px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.10),transparent_28%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-8 text-center shadow-[var(--shadow-lg)] md:p-12">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-destructive/15 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              <Lock className="h-3.5 w-3.5" />
              Accès restreint
            </div>

            <p className="font-display text-7xl font-bold tracking-tight text-destructive/20 md:text-8xl">
              403
            </p>

            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Accès refusé
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground md:text-base">
              Vous n’avez pas le niveau de rôle nécessaire pour accéder à cette ressource
              ou exécuter cette action.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => navigate('/dashboard')}
                className="h-11 rounded-2xl px-5 shadow-[0_12px_24px_hsl(var(--primary)/0.22)]"
              >
                <Home size={16} />
                Retour au dashboard
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="h-11 rounded-2xl px-5"
              >
                <ArrowLeft size={16} />
                Page précédente
              </Button>
            </div>

            <div className="mt-8 rounded-2xl border bg-background/50 p-4">
              <p className="text-sm font-medium">Conseil</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Si cette page devrait vous être accessible, vérifiez votre rôle
                ou demandez les permissions nécessaires à un administrateur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}