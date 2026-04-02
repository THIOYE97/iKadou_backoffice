import { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { paymentApi } from '@/Api/paymentApi';
import { Button } from '@/components/ui/button';
import { PAYMENT_STATUS } from '@/Util/statusConfig';

// Allowed transitions per status
const TRANSITIONS = {
  pending:   ['confirmed', 'failed', 'cancelled'],
  confirmed: ['refunded'],
  failed:    ['pending'],
  partial:   ['confirmed', 'failed', 'cancelled'],
  refunded:  [],
  cancelled: [],
};

// Statuses that require a comment
const NEEDS_COMMENT = ['failed', 'cancelled', 'refunded'];

export default function PaymentStatusModal({ payment, onClose, onSuccess }) {
  const [status, setStatus]   = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const allowed = TRANSITIONS[payment.status] || [];

  const handleSubmit = async () => {
    if (!status) { setError('Sélectionnez un nouveau statut'); return; }
    if (NEEDS_COMMENT.includes(status) && !comment.trim()) {
      setError('Un commentaire est requis pour ce statut');
      return;
    }
    setLoading(true); setError(null);
    try {
      await paymentApi.updateStatus(payment.id, { status, comment: comment || undefined });
      onSuccess(status);
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
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Current status */}
          <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">Statut actuel :</span>
            <span className="font-semibold">{PAYMENT_STATUS[payment.status]?.label || payment.status}</span>
          </div>

          {!allowed.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune transition possible depuis le statut <strong>{payment.status}</strong>.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nouveau statut</label>
                {allowed.map(s => {
                  const cfg = PAYMENT_STATUS[s] || { label: s, variant: 'outline' };
                  return (
                    <label key={s} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      status === s ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                    }`}>
                      <input
                        type="radio" name="status" value={s}
                        checked={status === s}
                        onChange={() => { setStatus(s); setError(null); }}
                        className="accent-primary"
                      />
                      <div>
                        <span className="text-sm font-medium">{cfg.label}</span>
                        {NEEDS_COMMENT.includes(s) && (
                          <span className="text-xs text-muted-foreground ml-2">(commentaire requis)</span>
                        )}
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
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-ring"
                  placeholder="Motif, référence, observations…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            {!!allowed.length && (
              <Button onClick={handleSubmit} disabled={loading || !status}>
                {loading && <Loader2 size={14} className="animate-spin" />}
                Enregistrer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
