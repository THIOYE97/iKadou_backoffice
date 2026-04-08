import { useState } from 'react';
import { X, Loader2, Radio, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { notificationApi } from '@/Api/notificationApi';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const CHANNELS = [
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'sms', label: 'SMS', icon: '💬' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { key: 'push', label: 'Push', icon: '🔔' },
];

const SEGMENTS = [
  { key: 'all_clients', label: 'Tous les clients actifs', desc: 'Tous les comptes avec statut actif', icon: '👥' },
  { key: 'leads_new', label: 'Leads nouveaux', desc: 'Leads avec statut "Nouveau"', icon: '🔥' },
];

const NOTIF_TYPES = [
  { key: 'custom', label: 'Message libre' },
  { key: 'new_terrain', label: 'Nouveau terrain disponible' },
  { key: 'welcome', label: 'Message de bienvenue' },
  { key: 'payment_pending', label: 'Rappel paiement en attente' },
];

export default function BroadcastModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [channel, setChannel] = useState('');
  const [segment, setSegment] = useState('');
  const [type, setType] = useState('custom');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canProceed = () => {
    if (step === 1) return !!channel && !!segment;
    if (step === 2) return type === 'custom' ? !!content.trim() : !!type;
    return true;
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await notificationApi.broadcast({
        channel,
        segment,
        type,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl animate-fade-in rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Radio size={18} className="text-primary" />
              Broadcast
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Envoi groupé à un segment
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {error ? (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle size={14} />
              {error}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Canal</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CHANNELS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setChannel(c.key)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-sm font-medium transition-all ${
                        channel === c.key
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <span className="text-xl">{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Segment cible</Label>
                {SEGMENTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSegment(s.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                      segment === s.key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Type de notification</Label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {NOTIF_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {channel === 'email' ? (
                <div className="space-y-1.5">
                  <Label>Objet de l'email</Label>
                  <Input
                    className="h-11 rounded-2xl"
                    placeholder="Objet…"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              ) : null}

              {type === 'custom' ? (
                <div className="space-y-1.5">
                  <Label>Contenu du message</Label>
                  <textarea
                    className="min-h-[140px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Votre message… Vous pouvez utiliser {{first_name}}, {{last_name}}"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables disponibles : <span className="font-mono">{'{{first_name}}'}</span>,{' '}
                    <span className="font-mono">{'{{last_name}}'}</span>
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    Confirmation requise
                  </p>
                  <p className="mt-1 text-amber-700 dark:text-amber-300">
                    Vous êtes sur le point d'envoyer un message à un large groupe.
                    Cette action ne peut pas être annulée.
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border bg-muted/50 p-4 text-sm">
                {[
                  ['Canal', CHANNELS.find((c) => c.key === channel)?.label],
                  ['Segment', SEGMENTS.find((s) => s.key === segment)?.label],
                  ['Type', NOTIF_TYPES.find((t) => t.key === type)?.label],
                  channel === 'email' && subject ? ['Objet', subject] : null,
                ]
                  .filter(Boolean)
                  .map(([l, v]) => (
                    <div key={l} className="flex gap-3">
                      <span className="w-24 text-muted-foreground">{l}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {step === 4 && result ? (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-300" />
              </div>
              <p className="font-display text-xl font-semibold">Broadcast terminé</p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Total', result.total, 'text-foreground'],
                  ['Envoyés', result.sent, 'text-emerald-600'],
                  ['Échecs', result.failed, 'text-destructive'],
                ].map(([l, v, cls]) => (
                  <div key={l} className="rounded-2xl border bg-muted/50 p-3 text-center">
                    <p className={`text-2xl font-bold ${cls}`}>{v}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-between pt-2">
            {step > 1 && step < 4 ? (
              <Button variant="outline" className="rounded-2xl" onClick={() => setStep((s) => s - 1)}>
                Retour
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button className="rounded-2xl" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                Suivant →
              </Button>
            ) : null}

            {step === 3 ? (
              <Button className="rounded-2xl bg-amber-600 hover:bg-amber-700" onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                {sending ? 'Envoi en cours…' : 'Confirmer et envoyer'}
              </Button>
            ) : null}

            {step === 4 ? (
              <Button className="rounded-2xl" onClick={onSuccess}>
                Fermer
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}