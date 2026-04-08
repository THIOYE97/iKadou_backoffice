import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Edit,
  RefreshCw,
  Images,
  Sparkles,
  MapPinned,
  Wallet,
  Ruler,
  Clock3,
  FileText,
} from 'lucide-react';
import { terrainsApi, zonesApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import TerrainImageUploader from '@/components/custome/TerrainImageUploader';
import { TERRAIN_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import TerrainFormModal from './TerrainFormModal';
import TerrainStatusModal from './TerrainStatusModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const fmt = (price, currency) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'XOF',
    maximumFractionDigits: 0,
  }).format(Number(price || 0));

const safeJsonParse = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  if (typeof value !== 'string') return fallback;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const resolveImageUrl = (img) => {
  const raw = img?.url || img?.path || img?.src || img?.image_url || '';
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `${BACKEND_URL}${raw}`;
  return `${BACKEND_URL}/${raw}`;
};

const normalizeTerrain = (raw) => {
  const images = safeJsonParse(raw?.images, []).map((img, index) => ({
    ...img,
    id: img?.id || `${raw?.id || 'terrain'}-img-${index}`,
    is_main: !!(img?.is_main || img?.isMain),
    resolvedUrl: resolveImageUrl(img),
  }));

  return {
    ...raw,
    price: raw?.price ?? 0,
    currency: raw?.currency ?? 'XOF',
    surface_m2: raw?.surface_m2 ?? null,
    images,
    history: Array.isArray(raw?.history) ? raw.history : [],
    documents: Array.isArray(raw?.documents) ? raw.documents : [],
  };
};

const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

function InfoCard({ icon: Icon, label, value }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function TerrainDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [terrain, setTerrain] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const load = async () => {
    setLoading(true);
    try {
      const [r, z] = await Promise.all([terrainsApi.get(id), zonesApi.list()]);
      setTerrain(normalizeTerrain(r.data));
      setZones(z.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!terrain) {
    return (
      <div className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] py-16 text-center text-muted-foreground shadow-sm">
        Terrain introuvable.
      </div>
    );
  }

  const parsedImages = safeArray(terrain.images);
  const mainImage =
    parsedImages.find((i) => i.is_main || i.isMain) || parsedImages[0] || null;

  const tabs = [
    { key: 'info', label: 'Informations' },
    { key: 'images', label: `Photos (${parsedImages.length || 0})` },
    { key: 'history', label: `Historique (${terrain.history?.length || 0})` },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mt-1 rounded-2xl"
              onClick={() => navigate('/terrains')}
            >
              <ArrowLeft size={18} />
            </Button>

            <div>
              <p className="font-mono text-xs font-semibold text-primary">{terrain.ref}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {terrain.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Fiche terrain et gestion opérationnelle
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={TERRAIN_STATUS} value={terrain.status} />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowStatus(true)}
            >
              <RefreshCw size={14} />
              Statut
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowEdit(true)}
            >
              <Edit size={14} />
              Modifier
            </Button>
          </div>
        </div>
      </section>

      {mainImage?.resolvedUrl ? (
        <section className="relative overflow-hidden rounded-[30px] border bg-muted shadow-sm">
          <img
            src={resolveImageUrl(mainImage)}
            alt={terrain.title}
            className="h-[320px] w-full object-cover"
          />
          {parsedImages.length > 1 ? (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              {parsedImages.length} photos
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))] text-white shadow-[0_12px_24px_hsl(var(--primary)/0.18)]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm xl:col-span-2">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Détails du terrain
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <InfoCard icon={Wallet} label="Prix" value={fmt(terrain.price, terrain.currency)} />
              <InfoCard icon={Ruler} label="Surface" value={terrain.surface_m2 ? `${terrain.surface_m2} m²` : null} />
              <InfoCard icon={MapPinned} label="Zone" value={terrain.zone_name} />
              <InfoCard icon={MapPinned} label="Région" value={terrain.zone_region} />
              <InfoCard icon={MapPinned} label="Localisation" value={terrain.location} />
              <InfoCard icon={Clock3} label="Disponibilité" value={terrain.availability} />
              <InfoCard icon={Sparkles} label="Mis en avant" value={terrain.is_featured ? 'Oui' : 'Non'} />
              <InfoCard icon={Wallet} label="Devise" value={terrain.currency} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Activité
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              <StatMini label="Créé le" value={readableDate(terrain.created_at)} />
              <StatMini label="Modifié" value={readableTimestamp(terrain.updated_at)} />
              <StatMini label="Documents liés" value={terrain.documents?.length || 0} />
            </CardContent>
          </Card>

          {terrain.description ? (
            <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm xl:col-span-3">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {terrain.description}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {activeTab === 'images' && (
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Images size={18} />
              Gestion des photos
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Les images sont compressées et converties en WebP. La première image
              sert d’image principale sur l’application.
            </p>
          </CardHeader>

          <CardContent className="p-5">
            <TerrainImageUploader
              terrainId={terrain.id}
              existingImages={parsedImages}
              onImagesChange={(imgs) =>
                setTerrain((t) => ({
                  ...t,
                  images: normalizeTerrain({ ...t, images: imgs }).images,
                }))
              }
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Historique des modifications
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5">
            {!terrain.history?.length ? (
              <div className="rounded-[24px] border border-dashed bg-muted/20 px-6 py-10 text-center">
                <p className="text-sm font-medium">Aucun historique</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les changements apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {terrain.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-4">
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-2xl bg-primary/10" />
                    <div className="flex-1 rounded-2xl border bg-background/60 p-4">
                      <span className="font-semibold">{h.field}</span>
                      {h.old_value && h.new_value ? (
                        <span className="text-muted-foreground">
                          {' '}
                          · {h.old_value} → {h.new_value}
                        </span>
                      ) : null}
                      {h.comment ? (
                        <span className="text-muted-foreground"> · "{h.comment}"</span>
                      ) : null}
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {h.author || 'Système'} · {readableTimestamp(h.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showEdit && (
        <TerrainFormModal
          terrain={terrain}
          zones={zones}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            load();
          }}
        />
      )}

      {showStatus && (
        <TerrainStatusModal
          terrain={terrain}
          onClose={() => setShowStatus(false)}
          onSuccess={() => {
            setShowStatus(false);
            load();
          }}
        />
      )}
    </div>
  );
}