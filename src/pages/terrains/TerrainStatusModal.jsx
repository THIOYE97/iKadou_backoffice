import { useState } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
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
    setLoading(true);
    setError(null);
    try {
      await terrainsApi.updateStatus(terrain.id, { status, comment });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Changer le statut
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mets à jour le cycle de vie du terrain
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {error ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {!allowed.length ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
              Aucune transition possible depuis le statut{' '}
              <strong>{terrain.status}</strong>.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {allowed.map((k) => (
                  <label
                    key={k}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                      status === k
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={k}
                      checked={status === k}
                      onChange={() => setStatus(k)}
                      className="accent-primary"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">
                        {TERRAIN_STATUS[k]?.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Commentaire</label>
                <textarea
                  className="min-h-[90px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Optionnel…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>

            {!!allowed.length && (
              <Button onClick={handleSubmit} className="rounded-2xl" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Enregistrer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}