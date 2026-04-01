import { useState, useEffect } from 'react';
import {
  Mail, MessageSquare, Bell, Send, Settings, Loader2,
  CheckCircle, AlertCircle, TestTube, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { notificationApi } from '@/Api/notificationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SendNotificationModal from './SendNotificationModal';

// ─── Channel cards config ─────────────────────────────────

const CHANNELS = [
  {
    key:       'email',
    label:     'Email',
    icon:      Mail,
    color:     'text-blue-600',
    bg:        'bg-blue-50',
    settingKey: 'email_enabled',
    desc:      'Notifications transactionnelles, confirmations, rappels',
    provider:  'SMTP / SendGrid',
    envVars:   ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
  },
  {
    key:       'sms',
    label:     'SMS',
    icon:      MessageSquare,
    color:     'text-green-600',
    bg:        'bg-green-50',
    settingKey: 'sms_enabled',
    desc:      'Rappels visites, alertes paiements, codes OTP',
    provider:  'Twilio SMS',
    envVars:   ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_SMS_FROM'],
  },
  {
    key:       'whatsapp',
    label:     'WhatsApp',
    icon:      Send,
    color:     'text-emerald-600',
    bg:        'bg-emerald-50',
    settingKey: 'whatsapp_enabled',
    desc:      'Messages riches, confirmations importantes',
    provider:  'Twilio WhatsApp Business',
    envVars:   ['TWILIO_ACCOUNT_SID', 'TWILIO_WHATSAPP_FROM'],
  },
  {
    key:       'push',
    label:     'Push',
    icon:      Bell,
    color:     'text-violet-600',
    bg:        'bg-violet-50',
    settingKey: 'push_enabled',
    desc:      'Notifications temps réel sur l\'application mobile',
    provider:  'Firebase FCM',
    envVars:   ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
  },
];

// Settings labels for display
const SETTING_META = {
  email_enabled:         { label: 'Email activé',         type: 'bool' },
  sms_enabled:           { label: 'SMS activé',           type: 'bool' },
  push_enabled:          { label: 'Push activé',          type: 'bool' },
  whatsapp_enabled:      { label: 'WhatsApp activé',      type: 'bool' },
  visit_reminder_hours:  { label: 'Rappel visite (heures avant)', type: 'number', unit: 'h' },
  support_phone:         { label: 'Téléphone support (SMS)', type: 'text' },
};

export default function ParametresCanaux() {
  const [settings, setSettings]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState(null);
  const [showTest, setShowTest]   = useState(false);
  const [localSettings, setLocalSettings] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getSettings();
      setSettings(res.data);
      // Flatten for local editing
      const flat = {};
      Object.entries(res.data).forEach(([k, v]) => { flat[k] = v.value; });
      setLocalSettings(flat);
    } catch { setError('Impossible de charger les paramètres'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleChannel = (settingKey) => {
    setLocalSettings(s => ({ ...s, [settingKey]: s[settingKey] === 'true' ? 'false' : 'true' }));
  };

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    try {
      await notificationApi.updateSettings(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const isEnabled = (key) => localSettings[key] === 'true';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Paramètres des canaux</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gérer les canaux de notification, les seuils et la configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTest(true)}>
            <TestTube size={15} /> Test d'envoi
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Settings size={14} />}
            {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Channel cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHANNELS.map(ch => {
          const enabled = isEnabled(ch.settingKey);
          const Icon = ch.icon;
          return (
            <Card key={ch.key} className={`transition-all ${!enabled ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${ch.bg} flex items-center justify-center`}>
                      <Icon size={20} className={ch.color} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{ch.label}</CardTitle>
                      <p className="text-xs text-muted-foreground">{ch.provider}</p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button onClick={() => toggleChannel(ch.settingKey)}
                    className="flex-shrink-0 transition-colors">
                    {enabled
                      ? <ToggleRight size={32} className="text-primary" />
                      : <ToggleLeft size={32} className="text-muted-foreground" />}
                  </button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{ch.desc}</p>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <Badge variant={enabled ? 'success' : 'outline'}>
                    {enabled ? '✓ Actif' : '⊘ Inactif'}
                  </Badge>
                </div>

                {/* Required env vars */}
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Variables d'environnement requises :</p>
                  <div className="flex flex-wrap gap-1">
                    {ch.envVars.map(v => (
                      <span key={v} className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings size={16} /> Paramètres avancés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(SETTING_META)
              .filter(([k]) => !k.endsWith('_enabled'))
              .map(([key, meta]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm">
                    {meta.label}
                    {meta.unit && <span className="text-muted-foreground ml-1">({meta.unit})</span>}
                  </Label>
                  <Input
                    type={meta.type === 'number' ? 'number' : 'text'}
                    value={localSettings[key] || ''}
                    onChange={e => setLocalSettings(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={settings[key]?.description || ''}
                  />
                  {settings[key]?.description && (
                    <p className="text-xs text-muted-foreground">{settings[key].description}</p>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Règles de déclenchement automatique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { event: 'Visite créée',           channels: ['email','sms'],         active: true },
              { event: 'Rappel visite (J-1)',     channels: ['sms','push'],          active: true },
              { event: 'Visite annulée',          channels: ['email','sms','push'],  active: true },
              { event: 'Paiement confirmé',       channels: ['email','sms'],         active: true },
              { event: 'Paiement échoué',         channels: ['email','push'],        active: true },
              { event: 'Ticket support ouvert',   channels: ['email'],              active: true },
              { event: 'Ticket résolu',           channels: ['email','push'],        active: true },
              { event: 'Compte créé',             channels: ['email'],              active: true },
              { event: 'Compte suspendu',         channels: ['email'],              active: true },
              { event: 'Agent assigné au lead',   channels: ['email','sms'],        active: false },
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-muted'}`} />
                  <span className="text-sm font-medium">{rule.event}</span>
                </div>
                <div className="flex items-center gap-2">
                  {rule.channels.map(c => {
                    const ch = CHANNELS.find(ch => ch.key === c);
                    const channelEnabled = isEnabled(ch?.settingKey);
                    return (
                      <span key={c} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        channelEnabled ? ch?.bg + ' ' + ch?.color : 'bg-muted text-muted-foreground line-through'
                      }`}>
                        {ch?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Les canaux barrés sont désactivés dans les paramètres ci-dessus. Les déclenchements automatiques respectent les préférences individuelles de chaque client.
          </p>
        </CardContent>
      </Card>

      {showTest && (
        <SendNotificationModal onClose={() => setShowTest(false)} onSuccess={() => setShowTest(false)} />
      )}
    </div>
  );
}
