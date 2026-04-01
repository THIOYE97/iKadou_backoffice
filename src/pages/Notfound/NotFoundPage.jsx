import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <p className="font-display text-8xl font-bold text-primary opacity-20">404</p>
      <h1 className="font-display text-2xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground text-sm max-w-xs">
        La page que vous recherchez n'existe pas ou vous n'avez pas les droits pour y accéder.
      </p>
      <Button onClick={() => navigate('/dashboard')}>
        <Home size={16} />
        Retour au dashboard
      </Button>
    </div>
  );
}
