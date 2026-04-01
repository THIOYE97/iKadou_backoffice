import { useState } from 'react';
import { X, Loader2, Radio, AlertTriangle, CheckCircle } from 'lucide-react';
import { notificationApi } from '@/Api/notificationApi';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const CHANNELS = [
  { key: 'email',    label: 'Email',    icon: '📧' },
  { key: 'sms',      label: 'SMS',      icon: '💬' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { key: 'push',     label: 'Push',     icon: '🔔' },
];

const SEGMENTS = [
  { key: 'all_clients',  label: 'Tous les clients actifs',       desc: 'Tous les comptes avec statut actif', icon: '👥' },
  { key: 'leads_new',    label: 'Leads nouveaux',                desc: 'Leads avec statut "Nouveau"',       icon: '🔥' },
];

const NOTIF_TYPES = [
  { key: 'custom',           label: 'Message libre' },
  { key: 'new_terrain',      label: 'Nouveau terrain disponible' },
  { key: 'welcome',          label: 'Message de bienvenue' },
  { key: 'payment_pending',  label: 'Rappel paiement en attente' },
];

export default function BroadcastModal({ onClose, onSuccess }) {
  const [step, setStep]       = useState(1);
  const [channel, setChannel] = useState('');
  const [segment, setSegment] = useState('');
  const [type, setType]       = useState('custom');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const canProceed = () => {
    if (step === 1) return !!channel && !!segment;
    if (step === 2) return type === 'custom' ? !!content.trim() : !!type;
    return true;
  };

  const handleSend = async () => {
    setSending(true); setError(null);
    try {
      const res = await notificationApi.broadcast({
        channel, segment, type,
        subject: subject || undefined,
        content: type === 'custom' ? content : undefined,
      });
      setResult(res.data);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du broadcast');
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Radio size={18} className="text-primary" /> Broadcast
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Envoi groupé à un segment</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* ── Step 1: Canal + Segment ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Canal</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CHANNELS.map(c => (
                    <button key={c.key} onClick={() => setChannel(c.key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        channel === c.key ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/40'
                      }`}>
                      <span className="text-xl">{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Segment cible</Label>
                {SEGMENTS.map(s => (
                  <button key={s.key} onClick={() => setSegment(s.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      segment === s.key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                    }`}>
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Contenu ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Type de notification</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={type} onChange={e => setType(e.target.value)}>
                  {NOTIF_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>

              {channel === 'email' && (
                <div className="space-y-1.5">
                  <Label>Objet de l'email</Label>
                  <Input placeholder="Objet…" value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
              )}

              {type === 'custom' && (
                <div className="space-y-1.5">
                  <Label>Contenu du message</Label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-ring"
                    placeholder="Votre message… Vous pouvez utiliser {{first_name}}, {{last_name}}"
                    value={content} onChange={e => setContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables disponibles : <span className="font-mono">{'{{first_name}}'}</span>, <span className="font-mono">{'{{last_name}}'}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">Confirmation requise</p>
                  <p className="text-amber-700 mt-1">Vous êtes sur le point d'envoyer un message à un large groupe. Cette action ne peut pas être annulée.</p>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 border p-4 space-y-2 text-sm">
                {[
                  ['Canal',   CHANNELS.find(c => c.key === channel)?.label],
                  ['Segment', SEGMENTS.find(s => s.key === segment)?.label],
                  ['Type',    NOTIF_TYPES.find(t => t.key === type)?.label],
                  channel === 'email' && subject && ['Objet', subject],
                ].filter(Boolean).map(([l, v]) => (
                  <div key={l} className="flex gap-3">
                    <span className="text-muted-foreground w-24">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Result ── */}
          {step === 4 && result && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <p className="font-display text-xl font-semibold">Broadcast terminé</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Total',   result.total,  'text-foreground'],
                  ['Envoyés', result.sent,   'text-emerald-600'],
                  ['Échecs',  result.failed, 'text-destructive'],
                ].map(([l, v, cls]) => (
                  <div key={l} className="rounded-xl bg-muted/50 border p-3 text-center">
                    <p className={`text-2xl font-display font-bold ${cls}`}>{v}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            {step > 1 && step < 4 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>Retour</Button>
            ) : <div />}

            {step < 3 && (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>Suivant →</Button>
            )}
            {step === 3 && (
              <Button onClick={handleSend} disabled={sending} className="bg-amber-600 hover:bg-amber-700">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                {sending ? 'Envoi en cours…' : 'Confirmer et envoyer'}
              </Button>
            )}
            {step === 4 && <Button onClick={onSuccess}>Fermer</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
