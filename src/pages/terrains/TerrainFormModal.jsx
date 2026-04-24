import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Loader2,
  MapPinned,
  Wallet,
  Ruler,
  FileText,
  LocateFixed,
  ShieldCheck,
  Building2,
  Scale,
  Phone,
  BadgeInfo,
  Sparkles,
} from 'lucide-react';
import { terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const optionalNumber = (min, max, invalidMessage) =>
  z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      const n = Number(value);
      return Number.isNaN(n) ? value : n;
    },
    z.number().min(min, invalidMessage).max(max, invalidMessage).optional()
  );

const optionalArrayFromTextarea = z.preprocess((value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}, z.array(z.string()).optional());

const schema = z.object({
  ref: z.string().min(1, 'Référence requise'),
  title: z.string().min(1, 'Titre requis'),
  price: z.coerce.number().positive('Prix invalide'),
  currency: z.string().default('XOF'),
  surfaceM2: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().positive('Surface invalide').optional()
  ),
  location: z.string().optional(),
  zoneId: z.string().optional(),
  status: z.string().default('draft'),
  latitude: optionalNumber(-90, 90, 'Latitude invalide'),
  longitude: optionalNumber(-180, 180, 'Longitude invalide'),

  environmentBenefits: optionalArrayFromTextarea,
  trustItems: optionalArrayFromTextarea,
  agencyName: z.string().optional(),
  notaryName: z.string().optional(),
  notaryPhone: z.string().optional(),
  ninacad: z.string().optional(),
  catalogTags: optionalArrayFromTextarea,
terrainUse: z.string().optional(),
catalogBucket: z.string().optional(),
displayInDiscovery: z.boolean().optional(),
});

const textareaToString = (value) => {
  if (Array.isArray(value)) return value.join('\n');
  if (!value) return '';
  return String(value);
};

export default function TerrainFormModal({ zones = [], onClose, onSuccess, terrain }) {
  const [serverError, setServerError] = useState(null);
  const isEdit = !!terrain;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: terrain
      ? {
          ref: terrain.ref ?? '',
          title: terrain.title ?? '',
          price: terrain.price ?? '',
          currency: terrain.currency ?? 'XOF',
          surfaceM2: terrain.surface_m2 ?? '',
          location: terrain.location ?? '',
          zoneId: terrain.zone_id ?? '',
          status: terrain.status ?? 'draft',
          latitude: terrain.latitude ?? '',
          longitude: terrain.longitude ?? '',

          environmentBenefits: textareaToString(
            terrain.environmentBenefits ??
              terrain.environment_benefits ??
              []
          ),
          trustItems: textareaToString(
            terrain.trustItems ??
              terrain.trust_items ??
              []
          ),
          agencyName: terrain.agencyName ?? terrain.agency_name ?? '',
          notaryName: terrain.notaryName ?? terrain.notary_name ?? '',
          notaryPhone: terrain.notaryPhone ?? terrain.notary_phone ?? '',
          ninacad: terrain.ninacad ?? '',
          catalogTags: textareaToString(
  terrain.catalogTags ?? terrain.catalog_tags ?? []
),
terrainUse: terrain.terrainUse ?? terrain.terrain_use ?? '',
catalogBucket: terrain.catalogBucket ?? terrain.catalog_bucket ?? '',
displayInDiscovery: !!(terrain.displayInDiscovery ?? terrain.display_in_discovery),
        }
      : {
          currency: 'XOF',
          status: 'draft',
          surfaceM2: '',
          location: '',
          zoneId: '',
          latitude: '',
          longitude: '',

          environmentBenefits: '',
          trustItems: '',
          agencyName: '',
          notaryName: '',
          notaryPhone: '',
          ninacad: '',
          catalogTags: '',
          terrainUse: '',
          catalogBucket: '',
          displayInDiscovery: false,
        },
  });

  const onSubmit = async (values) => {
    setServerError(null);

    try {
      const payload = {
        ...values,
        surfaceM2: values.surfaceM2 ?? null,
        location: values.location || null,
        zoneId: values.zoneId || null,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,

        environmentBenefits: values.environmentBenefits ?? [],
        trustItems: values.trustItems ?? [],
        agencyName: values.agencyName || null,
        notaryName: values.notaryName || null,
        notaryPhone: values.notaryPhone || null,
        ninacad: values.ninacad || null,
      };

      if (isEdit) {
        await terrainsApi.update(terrain.id, payload);
      } else {
        await terrainsApi.create(payload);
      }

      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/90 p-5 backdrop-blur">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier le terrain' : 'Nouveau terrain'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Renseigne les informations principales, légales et commerciales du terrain
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-5">
          {serverError ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Référence *</Label>
              <Input className="h-11 rounded-2xl" placeholder="IKD-001" {...register('ref')} />
              {errors.ref ? <p className="text-xs text-destructive">{errors.ref.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                {...register('status')}
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="reserved">Réservé</option>
                <option value="sold">Vendu</option>
                <option value="unavailable">Indisponible</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Titre *</Label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-2xl pl-10"
                placeholder="Terrain résidentiel Bamako Nord"
                {...register('title')}
              />
            </div>
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Prix *</Label>
              <div className="relative">
                <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  className="h-11 rounded-2xl pl-10"
                  placeholder="15000000"
                  {...register('price')}
                />
              </div>
              {errors.price ? <p className="text-xs text-destructive">{errors.price.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Devise</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                {...register('currency')}
              >
                <option value="XOF">XOF (FCFA)</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Surface (m²)</Label>
              <div className="relative">
                <Ruler className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  className="h-11 rounded-2xl pl-10"
                  placeholder="500"
                  {...register('surfaceM2')}
                />
              </div>
              {errors.surfaceM2 ? <p className="text-xs text-destructive">{errors.surfaceM2.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Zone</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                {...register('zoneId')}
              >
                <option value="">— Sélectionner —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Localisation</Label>
            <div className="relative">
              <MapPinned className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-2xl pl-10"
                placeholder="Quartier Boulkassoumbougou, Bamako"
                {...register('location')}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <LocateFixed className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Coordonnées géographiques</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  className="h-11 rounded-2xl"
                  placeholder="12.6392"
                  {...register('latitude')}
                />
                {errors.latitude ? <p className="text-xs text-destructive">{errors.latitude.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  className="h-11 rounded-2xl"
                  placeholder="-8.0029"
                  {...register('longitude')}
                />
                {errors.longitude ? <p className="text-xs text-destructive">{errors.longitude.message}</p> : null}
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Champs optionnels mais recommandés pour la localisation précise du terrain.
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Avantages du terrain et de l’environnement</p>
            </div>

            <div className="space-y-1.5">
              <Label>Avantages environnementaux</Label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none"
                placeholder={`Un avantage par ligne\nRoute goudronnée\nPharmacie à proximité\nCentre-ville accessible`}
                {...register('environmentBenefits')}
              />
              {errors.environmentBenefits ? (
                <p className="text-xs text-destructive">{errors.environmentBenefits.message}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Éléments de confiance</p>
            </div>

            <div className="space-y-1.5">
              <Label>Éléments de confiance</Label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none"
                placeholder={`Un élément par ligne\nTitre foncier disponible\nSuivi notarial\nRéférence cadastrale vérifiée`}
                {...register('trustItems')}
              />
              {errors.trustItems ? (
                <p className="text-xs text-destructive">{errors.trustItems.message}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Informations commerciales et légales</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Agence vendeuse</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 rounded-2xl pl-10"
                    placeholder="Ikadou Immobilier"
                    {...register('agencyName')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Nom du notaire</Label>
                <div className="relative">
                  <Scale className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 rounded-2xl pl-10"
                    placeholder="Maître ..."
                    {...register('notaryName')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Numéro du notaire</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 rounded-2xl pl-10"
                    placeholder="+223 ..."
                    {...register('notaryPhone')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Numéro NINACAD</Label>
                <div className="relative">
                  <BadgeInfo className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 rounded-2xl pl-10"
                    placeholder="NINACAD-..."
                    {...register('ninacad')}
                  />
                </div>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
  <div className="mb-3 flex items-center gap-2">
    <Sparkles className="h-4 w-4 text-primary" />
    <p className="text-sm font-medium">Publication catalogue</p>
  </div>

  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div className="space-y-1.5">
      <Label>Usage du terrain</Label>
      <select
        className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
        {...register('terrainUse')}
      >
        <option value="">— Sélectionner —</option>
        <option value="agricole">Agricole</option>
      </select>
    </div>

    <div className="space-y-1.5">
      <Label>Placement catalogue</Label>
      <select
        className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
        {...register('catalogBucket')}
      >
        <option value="">— Sélectionner —</option>
        <option value="a_decouvrir">À découvrir</option>
        <option value="opportunite">Opportunité</option>
        <option value="agricole">Agricole</option>
      </select>
    </div>
  </div>

  <div className="mt-4 space-y-1.5">
    <Label>Tags catalogue</Label>
    <textarea
      className="min-h-[110px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none"
      placeholder={`Un tag par ligne\npremium\nnouveau\nechelonne`}
      {...register('catalogTags')}
    />
  </div>

  <label className="mt-4 flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
    <input type="checkbox" {...register('displayInDiscovery')} />
    <span className="text-sm font-medium">Afficher dans “À découvrir”</span>
  </label>
</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
