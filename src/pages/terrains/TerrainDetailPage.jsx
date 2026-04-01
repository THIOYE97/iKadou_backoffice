import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit, RefreshCw, Images } from 'lucide-react';
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
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!terrain) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Terrain introuvable.
      </div>
    );
  }

const parsedImages = safeArray(terrain.images);
const mainImage =
  parsedImages.find((i) => i.is_main || i.isMain) ||
  parsedImages[0] ||
  null;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/terrains')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-primary font-semibold">{terrain.ref}</p>
          <h1 className="font-display text-2xl font-semibold truncate">{terrain.title}</h1>
        </div>
        <StatusBadge map={TERRAIN_STATUS} value={terrain.status} />
        <Button variant="outline" size="sm" onClick={() => setShowStatus(true)}>
          <RefreshCw size={14} /> Statut
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Edit size={14} /> Modifier
        </Button>
      </div>

      {mainImage?.resolvedUrl && (
        <div className="relative rounded-xl overflow-hidden h-56 bg-muted">
          <img
            src={resolveImageUrl(mainImage)}
            alt={terrain.title}
            className="w-full h-full object-cover"
          />
          {parsedImages.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {parsedImages.length} photos
            </div>
          )}
        </div>
      )}

      <div className="flex border-b gap-1">
        {[
          { key: 'info', label: 'Informations' },
          { key: 'images', label: `Photos (${parsedImages.length || 0})` },
          { key: 'history', label: `Historique (${terrain.history?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Détails du terrain</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Prix', fmt(terrain.price, terrain.currency)],
                ['Surface', terrain.surface_m2 ? `${terrain.surface_m2} m²` : null],
                ['Zone', terrain.zone_name],
                ['Région', terrain.zone_region],
                ['Localisation', terrain.location],
                ['Disponibilité', terrain.availability],
                ['Mis en avant', terrain.is_featured ? 'Oui' : 'Non'],
                ['Devise', terrain.currency],
              ]
                .filter(([, v]) => v)
                .map(([l, v]) => (
                  <div key={l}>
                    <p className="text-muted-foreground text-xs mb-0.5">{l}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Activité</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Créé le</p>
                <p>{readableDate(terrain.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Modifié</p>
                <p>{readableTimestamp(terrain.updated_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Documents liés</p>
                <p className="font-semibold">{terrain.documents?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          {terrain.description && (
            <Card className="md:col-span-3">
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {terrain.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'images' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Images size={16} /> Gestion des photos
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Les images sont automatiquement compressées et converties en WebP par le serveur.
              La première image est affichée comme image principale sur l'application mobile.
            </p>
          </CardHeader>
          <CardContent>
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
        <Card>
          <CardHeader><CardTitle className="text-base">Historique des modifications</CardTitle></CardHeader>
          <CardContent>
            {!terrain.history?.length ? (
              <p className="text-sm text-muted-foreground">Aucun historique.</p>
            ) : (
              <div className="space-y-3">
                {terrain.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">{h.field}</span>
                      {h.old_value && h.new_value && (
                        <span className="text-muted-foreground"> · {h.old_value} → {h.new_value}</span>
                      )}
                      {h.comment && (
                        <span className="text-muted-foreground"> · "{h.comment}"</span>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
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
