import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { TERRAIN_STATUS } from '@/Util/statusConfig';

const TRANSITIONS = {
  draft: ['published', 'unavailable'],
  published: ['reserved', 'unavailable', 'draft'],
  reserved: ['published', 'sold', 'unavailable'],
  sold: [],
  unavailable: ['draft', 'published'],
};

export default function TerrainStatusModal({ terrain, onClose, onSuccess }) {
  const [status, setStatus] = useState(terrain.status);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allowed = TRANSITIONS[terrain.status] || [];

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      await terrainsApi.updateStatus(terrain.id, { status, comment });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display font-semibold">Changer le statut</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
          {!allowed.length
            ? <p className="text-sm text-muted-foreground">Aucune transition possible depuis le statut <strong>{terrain.status}</strong>.</p>
            : <>
                <div className="space-y-2">
                  {allowed.map(k => (
                    <label key={k} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${status === k ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}>
                      <input type="radio" name="status" value={k} checked={status === k} onChange={() => setStatus(k)} className="accent-primary" />
                      <span className="text-sm font-medium">{TERRAIN_STATUS[k]?.label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Commentaire</label>
                  <textarea className="w-full min-h-[72px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Optionnel…" value={comment} onChange={e => setComment(e.target.value)} />
                </div>
              </>
          }
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            {!!allowed.length && (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 size={14} className="animate-spin" />} Enregistrer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}