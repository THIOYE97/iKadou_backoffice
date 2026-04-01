import { useState, useEffect } from 'react';
import { X, Loader2, Smartphone, Trash2, Mail, MessageSquare, Bell, Send, CheckCircle } from 'lucide-react';
import { notificationApi } from '@/Api/notificationApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { readableDate } from '@/Util/readableDate';

const CHANNEL_PREFS = [
  { key: 'emailEnabled',    label: 'Email',     icon: Mail,           color: 'text-blue-600',   prefKey: 'email_enabled' },
  { key: 'smsEnabled',      label: 'SMS',        icon: MessageSquare,  color: 'text-green-600',  prefKey: 'sms_enabled' },
  { key: 'pushEnabled',     label: 'Push',       icon: Bell,           color: 'text-violet-600', prefKey: 'push_enabled' },
  { key: 'whatsappEnabled', label: 'WhatsApp',   icon: Send,           color: 'text-emerald-600',prefKey: 'whatsapp_enabled' },
];

const NOTIF_PREFS = [
  { key: 'visitNotifs',   label: 'Notifications de visite',   desc: 'Confirmation, rappel, annulation, replanification' },
  { key: 'paymentNotifs', label: 'Notifications de paiement', desc: 'Confirmation, échec, reçu de paiement' },
  { key: 'promoNotifs',   label: 'Communications promotionnelles', desc: 'Nouveaux terrains, offres spéciales, broadcasts' },
];

const PLATFORM_ICONS = { ios: '🍎', android: '🤖', web: '🌐' };

export default function ClientPreferencesModal({ clientId, clientName, onClose }) {
  const [prefs, setPrefs]     = useState(null);
  const [tokens, setTokens]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [local, setLocal]     = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [prefsRes, tokensRes] = await Promise.all([
        notificationApi.getClientPrefs(clientId),
        notificationApi.getClientTokens(clientId),
      ]);
      setPrefs(prefsRes.data);
      setTokens(tokensRes.data);
      // Map snake_case to camelCase for local state
      const p = prefsRes.data;
      setLocal({
        emailEnabled:    p.email_enabled,
        smsEnabled:      p.sms_enabled,
        pushEnabled:     p.push_enabled,
        whatsappEnabled: p.whatsapp_enabled,
        visitNotifs:     p.visit_notifs,
        paymentNotifs:   p.payment_notifs,
        promoNotifs:     p.promo_notifs,
      });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [clientId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationApi.updateClientPrefs(clientId, local);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally { setSaving(false); }
  };

  const handleDeleteToken = async (tokenId) => {
    await notificationApi.deleteClientToken(clientId, tokenId);
    setTokens(t => t.filter(tk => tk.id !== tokenId));
  };

  const toggle = (key) => setLocal(l => ({ ...l, [key]: !l[key] }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-display font-semibold">Préférences notifications</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{clientName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-5 space-y-5">

            {/* Canaux */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Canaux autorisés</h3>
              <div className="grid grid-cols-2 gap-2">
                {CHANNEL_PREFS.map(ch => {
                  const Icon = ch.icon;
                  const enabled = local[ch.key];
                  return (
                    <button key={ch.key} onClick={() => toggle(ch.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        enabled
                          ? 'border-primary bg-primary/5'
                          : 'border-border opacity-60 hover:opacity-80'
                      }`}>
                      <Icon size={16} className={enabled ? ch.color : 'text-muted-foreground'} />
                      <span className={`text-sm font-medium ${enabled ? '' : 'text-muted-foreground'}`}>
                        {ch.label}
                      </span>
                      <span className={`ml-auto text-xs font-semibold ${enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                        {enabled ? 'Oui' : 'Non'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Types de notification */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Types de notifications</h3>
              <div className="space-y-2">
                {NOTIF_PREFS.map(pref => (
                  <label key={pref.key}
                    className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
                    <div
                      onClick={() => toggle(pref.key)}
                      className={`relative w-9 h-5 rounded-full flex-shrink-0 mt-0.5 transition-colors cursor-pointer ${
                        local[pref.key] ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        local[pref.key] ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pref.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Device tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Smartphone size={15} /> Appareils enregistrés ({tokens.length})
                </h3>
              </div>

              {!tokens.length ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Aucun appareil enregistré pour les notifications push
                </div>
              ) : (
                <div className="space-y-2">
                  {tokens.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <span className="text-xl">{PLATFORM_ICONS[t.platform] || '📱'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">{t.platform}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{t.token.substring(0, 32)}…</p>
                        <p className="text-xs text-muted-foreground">Enregistré le {readableDate(t.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={t.is_active ? 'success' : 'outline'} className="text-[10px]">
                          {t.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <button onClick={() => handleDeleteToken(t.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" />
                  : saved ? <CheckCircle size={14} /> : null}
                {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé !' : 'Sauvegarder les préférences'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
