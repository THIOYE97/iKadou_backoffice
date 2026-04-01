import { useState, useEffect } from 'react';
import { X, Eye, Save, Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { notificationApi } from '@/Api/notificationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const CHANNEL_COLORS = {
  email:    'bg-blue-100 text-blue-800',
  sms:      'bg-green-100 text-green-800',
  whatsapp: 'bg-emerald-100 text-emerald-800',
  push:     'bg-violet-100 text-violet-800',
  in_app:   'bg-gray-100 text-gray-800',
};

// Extract {{variable}} placeholders from a string
const extractVars = (str = '') => {
  const matches = str.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map(m => m[1]))];
};

// Replace {{var}} with preview values
const interpolate = (str = '', vars = {}) =>
  str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] !== undefined ? vars[k] : `<span style="background:#fef3c7;padding:0 3px;border-radius:3px">{{${k}}}</span>`
  );

export default function TemplateEditor({ template, onClose, onSuccess }) {
  const [name, setName]       = useState(template.name || '');
  const [subject, setSubject] = useState(template.subject || '');
  const [content, setContent] = useState(template.content || '');
  const [isActive, setIsActive] = useState(template.is_active ?? true);
  const [preview, setPreview] = useState('split'); // 'editor' | 'preview' | 'split'
  const [previewVars, setPreviewVars] = useState({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState(null);

  // Auto-detect variables
  const allVars = [...new Set([...extractVars(subject), ...extractVars(content)])];

  // Init preview vars with placeholder values
  useEffect(() => {
    const defaults = {
      first_name: 'Moussa', last_name: 'Diallo',
      terrain_title: 'Terrain Bamako Nord - IKD-042',
      visit_date: '15 avril 2025', visit_time: '10:00',
      agent_name: 'Aminata Keita', agent_phone: '+223 76 00 00 00',
      payment_ref: 'PAY-A1B2C3D4', amount: '15 000 000', currency: 'XOF',
      ticket_ref: 'TKT-001ABC', subject: 'Problème accès terrain',
      priority: 'Haute', reset_url: 'https://app.ikadou.com/reset/token',
      app_url: 'https://app.ikadou.com', cancel_reason: 'Indisponibilité agent',
      new_date: '22 avril 2025', new_time: '14:30', payment_date: '10 avril 2025',
    };
    const vars = {};
    allVars.forEach(v => { vars[v] = defaults[v] || `[${v}]`; });
    setPreviewVars(vars);
  }, [content, subject]);

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    try {
      await notificationApi.templateUpdate(template.id, {
        content, subject: subject || undefined, isActive,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onSuccess(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  // Build preview HTML for email
  const buildPreview = () => {
    if (template.channel !== 'email') {
      return `<div style="font-family:sans-serif;padding:20px;white-space:pre-wrap;font-size:14px;color:#374151;">${interpolate(content, previewVars)}</div>`;
    }

    const renderedContent = interpolate(content, previewVars);
    const renderedSubject = interpolate(subject, previewVars);

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<style>
body{margin:0;padding:16px;background:#f5f0ea;font-family:'Helvetica Neue',Arial,sans-serif}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.1)}
.subj{background:#1a1008;color:#dc7a20;padding:10px 24px;font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.hdr{background:#1c1208;padding:20px 28px}
.logo{color:#dc7a20;font-size:22px;font-weight:700}
.tag{color:rgba(255,255,255,.35);font-size:10px;margin-top:2px}
.body{padding:28px;color:#2d2416;font-size:15px;line-height:1.75}
.hi{font-size:17px;font-weight:600;margin-bottom:14px}
.box{background:#fdf7ee;border-left:4px solid #dc7a20;border-radius:6px;padding:14px 18px;margin:18px 0;font-size:14px}
.btn{display:inline-block;margin:16px 0;padding:11px 26px;background:#dc7a20;color:#fff;border-radius:7px;text-decoration:none;font-weight:600;font-size:14px}
.info{font-size:12px;color:#9e8a6a;border-top:1px solid #f0e8dc;padding-top:14px;margin-top:20px}
.ftr{background:#fdf7ee;padding:16px 28px;text-align:center;font-size:11px;color:#9e8a6a}
.ftr a{color:#dc7a20}
</style></head><body>
<div class="wrap">
<div class="subj">Objet : ${renderedSubject}</div>
<div class="hdr"><div class="logo">🌍 Ikadou</div><div class="tag">Investir au Mali, en toute sérénité</div></div>
<div class="body">${renderedContent}</div>
<div class="ftr"><p>© ${new Date().getFullYear()} Ikadou · <a href="#">Se désabonner</a> · <a href="#">Confidentialité</a></p><p>Email automatique — merci de ne pas répondre directement.</p></div>
</div></body></html>`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CHANNEL_COLORS[template.channel] || 'bg-muted'}`}>
                {template.channel?.toUpperCase()}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{template.type}</span>
            </div>
            <h2 className="font-display font-semibold mt-0.5">{name}</h2>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {[['editor','Éditeur'],['split','Split'],['preview','Aperçu']].map(([k,l]) => (
              <button key={k} onClick={() => setPreview(k)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${preview === k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {l}
              </button>
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </Button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-1">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Main area */}
        <div className="flex-1 overflow-hidden flex gap-0">

          {/* Editor panel */}
          {(preview === 'editor' || preview === 'split') && (
            <div className={`flex flex-col gap-4 p-5 overflow-y-auto ${preview === 'split' ? 'w-1/2 border-r' : 'w-full'}`}>

              {/* Subject (email only) */}
              {template.channel === 'email' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Objet de l'email</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Objet…" className="font-medium" />
                </div>
              )}

              {/* Content */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    Contenu {template.channel === 'email' ? '(HTML)' : '(texte)'}
                  </Label>
                  <span className="text-xs text-muted-foreground">{content.length} car.</span>
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full flex-1 min-h-[300px] font-mono text-xs rounded-lg border border-input bg-muted/30 px-3 py-2.5 focus:ring-1 focus:ring-ring resize-y"
                  spellCheck={false}
                />
              </div>

              {/* Detected variables */}
              {allVars.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Variables détectées — valeurs de prévisualisation</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {allVars.map(v => (
                      <div key={v} className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          {`{{${v}}}`}
                        </span>
                        <Input
                          value={previewVars[v] || ''}
                          onChange={e => setPreviewVars(p => ({ ...p, [v]: e.target.value }))}
                          className="h-7 text-xs"
                          placeholder={v}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setIsActive(v => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium">{isActive ? 'Template actif' : 'Template inactif'}</span>
              </label>
            </div>
          )}

          {/* Preview panel */}
          {(preview === 'preview' || preview === 'split') && (
            <div className={`overflow-hidden flex flex-col ${preview === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="px-4 py-2 border-b flex items-center gap-2 flex-shrink-0 bg-muted/30">
                <Eye size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Aperçu</span>
                {template.channel === 'email' && (
                  <span className="text-xs text-muted-foreground ml-auto">Rendu email</span>
                )}
              </div>
              <iframe
                key={JSON.stringify(previewVars) + content + subject}
                srcDoc={buildPreview()}
                className="flex-1 w-full border-0"
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
