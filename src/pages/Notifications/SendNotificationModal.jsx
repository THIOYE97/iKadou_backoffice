import { useState, useEffect } from 'react';
import { X, Search, Loader2, Send, Eye, ChevronDown } from 'lucide-react';
import { notificationApi } from '@/Api/notificationApi';
import api from '@/Api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CHANNELS = [
  { key: 'email',    label: 'Email',     icon: '📧', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { key: 'sms',      label: 'SMS',       icon: '💬', color: 'border-green-300 bg-green-50 text-green-700' },
  { key: 'whatsapp', label: 'WhatsApp',  icon: '📱', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { key: 'push',     label: 'Push',      icon: '🔔', color: 'border-violet-300 bg-violet-50 text-violet-700' },
];

const NOTIF_TYPES = [
  { key: 'visit_confirmation', label: 'Confirmation visite' },
  { key: 'visit_reminder',     label: 'Rappel visite' },
  { key: 'visit_cancelled',    label: 'Visite annulée' },
  { key: 'visit_rescheduled',  label: 'Visite replanifiée' },
  { key: 'payment_confirmed',  label: 'Paiement confirmé' },
  { key: 'payment_pending',    label: 'Paiement en attente' },
  { key: 'payment_failed',     label: 'Paiement échoué' },
  { key: 'ticket_opened',      label: 'Ticket support ouvert' },
  { key: 'ticket_resolved',    label: 'Ticket résolu' },
  { key: 'lead_assigned',      label: 'Agent assigné' },
  { key: 'welcome',            label: 'Message de bienvenue' },
  { key: 'custom',             label: 'Message libre' },
];

const SAMPLE_VARS = {
  first_name: 'Moussa', last_name: 'Diallo',
  terrain_title: 'Terrain Bamako Nord', visit_date: '15 avril 2025',
  visit_time: '10:00', agent_name: 'Aminata Keita', agent_phone: '+223 76 00 00 00',
  payment_ref: 'PAY-A1B2C3', amount: '15 000 000', currency: 'XOF',
  ticket_ref: 'TKT-0042', subject: 'Demande information', priority: 'Haute',
};

export default function SendNotificationModal({ onClose, onSuccess }) {
  const [step, setStep]             = useState(1); // 1=canal, 2=destinataire, 3=contenu, 4=confirm
  const [channel, setChannel]       = useState('');
  const [type, setType]             = useState('custom');
  const [recipientMode, setRecipientMode] = useState('search'); // 'search' | 'manual'
  const [search, setSearch]         = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [manualRecipient, setManualRecipient] = useState('');
  const [subject, setSubject]       = useState('');
  const [content, setContent]       = useState('');
  const [variables, setVariables]   = useState({});
  const [sending, setSending]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);

  // Search clients
  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get('/clients', { params: { search, limit: 8 } });
        setSearchResults(r.data.data);
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Auto-fill recipient when client selected
  useEffect(() => {
    if (!selectedClient) return;
    if (channel === 'email') setManualRecipient(selectedClient.email || '');
    else if (channel === 'sms' || channel === 'whatsapp') setManualRecipient(selectedClient.phone || '');
    setVariables(v => ({
      ...SAMPLE_VARS,
      first_name: selectedClient.first_name,
      last_name: selectedClient.last_name,
    }));
  }, [selectedClient, channel]);

  const canProceed = () => {
    if (step === 1) return !!channel;
    if (step === 2) return !!(selectedClient || manualRecipient.trim());
    if (step === 3) return type === 'custom' ? !!content.trim() : !!type;
    return true;
  };

  const handleSend = async () => {
    setSending(true); setError(null);
    try {
      const recipient = manualRecipient.trim();
      const res = await notificationApi.send({
        channel, type,
        recipient,
        subject: subject || undefined,
        content: type === 'custom' ? content : undefined,
        variables,
        relatedType: selectedClient ? 'client' : undefined,
        relatedId: selectedClient?.id,
      });
      setResult(res.data);
      setStep(5);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally { setSending(false); }
  };

  const recipient = manualRecipient.trim();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-display font-semibold">Envoyer une notification</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step < 5 ? `Étape ${step}/4` : 'Résultat'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* ── Step 1: Canal ── */}
          {step === 1 && (
            <div className="space-y-3">
              <Label>Choisir le canal d'envoi</Label>
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map(c => (
                  <button key={c.key} onClick={() => setChannel(c.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      channel === c.key ? c.color + ' border-opacity-100' : 'border-border hover:bg-muted/40'
                    }`}>
                    <span className="text-xl">{c.icon}</span>
                    <span className="font-medium text-sm">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Destinataire ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setRecipientMode('search')}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${recipientMode === 'search' ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted/40'}`}>
                  Chercher un client
                </button>
                <button onClick={() => setRecipientMode('manual')}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${recipientMode === 'manual' ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted/40'}`}>
                  Adresse manuelle
                </button>
              </div>

              {recipientMode === 'search' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Nom, email, téléphone…" className="pl-8"
                      value={search} onChange={e => setSearch(e.target.value)} />
                    {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      {searchResults.map(c => (
                        <button key={c.id} onClick={() => { setSelectedClient(c); setSearch(`${c.first_name} ${c.last_name}`); setSearchResults([]); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50 border-b last:border-0 ${selectedClient?.id === c.id ? 'bg-primary/5' : ''}`}>
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                            {c.first_name?.[0]}{c.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{c.first_name} {c.last_name}</p>
                            <p className="text-xs text-muted-foreground">{c.email || c.phone || '—'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedClient && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">✓ {selectedClient.first_name} {selectedClient.last_name}</span>
                      <span className="text-muted-foreground ml-2">
                        {channel === 'email' ? selectedClient.email : selectedClient.phone}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {channel === 'email' ? 'Adresse email' : channel === 'push' ? 'Token FCM' : 'Numéro de téléphone'}
                  </Label>
                  <Input
                    placeholder={channel === 'email' ? 'client@example.com' : channel === 'push' ? 'fcm-token...' : '+223 70 00 00 00'}
                    value={manualRecipient}
                    onChange={e => setManualRecipient(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Type & Contenu ── */}
          {step === 3 && (
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
                  <Label>Sujet (optionnel — override le template)</Label>
                  <Input placeholder="Objet de l'email…" value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
              )}

              {type === 'custom' && (
                <div className="space-y-1.5">
                  <Label>Contenu</Label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-ring"
                    placeholder={channel === 'email' ? 'Contenu HTML ou texte…' : 'Texte du message…'}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                </div>
              )}

              {type !== 'custom' && (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Le template <strong>{NOTIF_TYPES.find(t => t.key === type)?.label}</strong> sera utilisé automatiquement avec les variables du destinataire.
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Confirmation ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 border p-4 space-y-3 text-sm">
                <p className="font-semibold text-base">Récapitulatif</p>
                {[
                  ['Canal',     CHANNELS.find(c => c.key === channel)?.label],
                  ['Type',      NOTIF_TYPES.find(t => t.key === type)?.label],
                  ['Destinataire', selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : recipient],
                  ['Adresse',   recipient],
                  channel === 'email' && subject && ['Objet', subject],
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-muted-foreground w-28 flex-shrink-0">{label}</span>
                    <span className="font-medium truncate">{val}</span>
                  </div>
                ))}
              </div>
              {type === 'custom' && content && (
                <div className="rounded-lg bg-muted/30 border px-3 py-2 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Aperçu contenu :</p>
                  <p className="line-clamp-3">{content}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Result ── */}
          {step === 5 && (
            <div className="text-center py-4 space-y-3">
              {result?.success ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <Send size={24} className="text-emerald-600" />
                  </div>
                  <p className="font-semibold text-lg">Notification envoyée !</p>
                  <p className="text-sm text-muted-foreground">
                    {CHANNELS.find(c => c.key === channel)?.label} envoyé à <strong>{recipient}</strong>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-destructive">Échec de l'envoi</p>
                  <p className="text-sm text-muted-foreground">{result?.error || 'Une erreur est survenue'}</p>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            {step > 1 && step < 5 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>Retour</Button>
            ) : <div />}

            {step < 4 && (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                Suivant →
              </Button>
            )}
            {step === 4 && (
              <Button onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Envoi…' : 'Envoyer'}
              </Button>
            )}
            {step === 5 && (
              <Button onClick={onSuccess}>Fermer</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
