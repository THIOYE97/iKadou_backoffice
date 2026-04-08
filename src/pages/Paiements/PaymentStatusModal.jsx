import { useState } from 'react';
import { X, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { paymentApi } from '@/Api/paymentApi';
import { Button } from '@/components/ui/button';
import { PAYMENT_STATUS } from '@/Util/statusConfig';

const TRANSITIONS = {
  pending: ['confirmed', 'failed', 'cancelled'],
  confirmed: ['refunded'],
  failed: ['pending'],
  partial: ['confirmed', 'failed', 'cancelled'],
  refunded: [],
  cancelled: [],
};

const NEEDS_COMMENT = ['failed', 'cancelled', 'refunded'];

export default function PaymentStatusModal({ payment, onClose, onSuccess }) {
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allowed = TRANSITIONS[payment.status] || [];

  const handleSubmit = async () => {
    if (!status) {
      setError('Sélectionnez un nouveau statut');
      return;
    }
    if (NEEDS_COMMENT.includes(status) && !comment.trim()) {
      setError('Un commentaire est requis pour ce statut');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await paymentApi.updateStatus(payment.id, { status, comment: comment || undefined });
      onSuccess(status);
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
              Mets à jour le cycle du paiement
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
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle size={14} />
              {error}
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Statut actuel :</span>
            <span className="font-semibold">
              {PAYMENT_STATUS[payment.status]?.label || payment.status}
            </span>
          </div>

          {!allowed.length ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-5 text-center text-sm text-muted-foreground">
              Aucune transition possible depuis le statut <strong>{payment.status}</strong>.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nouveau statut</label>

                {allowed.map((s) => {
                  const cfg = PAYMENT_STATUS[s] || { label: s };

                  return (
                    <label
                      key={s}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                        status === s
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={status === s}
                        onChange={() => {
                          setStatus(s);
                          setError(null);
                        }}
                        className="accent-primary"
                      />

                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{cfg.label}</span>
                          {NEEDS_COMMENT.includes(s) ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (commentaire requis)
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Commentaire {NEEDS_COMMENT.includes(status) ? '*' : '(optionnel)'}
                </label>
                <textarea
                  className="min-h-[90px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Motif, référence, observations…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>

            {allowed.length ? (
              <Button className="rounded-2xl" onClick={handleSubmit} disabled={loading || !status}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Enregistrer
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}