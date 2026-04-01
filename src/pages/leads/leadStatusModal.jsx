import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { leadsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { LEAD_STATUS } from '@/Util/statusConfig';

const SENSITIVE = ['lost', 'duplicate'];

export default function LeadStatusModal({ lead, onClose, onSuccess }) {
  const [status, setStatus] = useState(lead.status);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const needsReason = SENSITIVE.includes(status);

  const handleSubmit = async () => {
    if (needsReason && !reason.trim()) {
      setError('Un motif est requis pour ce statut');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await leadsApi.updateStatus(lead.id, { status, reason });
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

          <div className="space-y-2">
            {Object.entries(LEAD_STATUS).map(([k, v]) => (
              <label key={k} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${status === k ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}>
                <input type="radio" name="status" value={k} checked={status === k} onChange={() => setStatus(k)} className="accent-primary" />
                <span className="text-sm font-medium">{v.label}</span>
              </label>
            ))}
          </div>

          {needsReason && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motif *</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-ring"
                placeholder={`Motif pour "${LEAD_STATUS[status]?.label}"…`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}