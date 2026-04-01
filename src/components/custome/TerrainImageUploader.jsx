import { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, Loader2, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { compressImageClient, getPreviewUrl, formatBytes } from '@/Util/imageCompressor';
import api from '@/Api/axiosInstance';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Terrain image manager.
 * - Drag & drop or click to select
 * - Client-side compression preview
 * - Upload to server (which compresses again to WebP with sharp)
 * - Delete, set-as-main, reorder
 */
export default function TerrainImageUploader({ terrainId, existingImages = [], onImagesChange }) {
  const [images, setImages] = useState(existingImages);
  const [pending, setPending] = useState([]); // files selected but not yet uploaded
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);

  // ── File selection / drag-drop ───────────────────────────

  const handleFiles = useCallback(async (fileList) => {
    setErrors([]);
    const files = Array.from(fileList);
    const MAX = 10;
    const remaining = MAX - images.length - pending.length;

    if (files.length > remaining) {
      setErrors([`Maximum ${MAX} images. Vous pouvez ajouter encore ${remaining} image(s).`]);
      files.splice(remaining);
    }

    const newPending = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setErrors(e => [...e, `"${file.name}" n'est pas une image valide`]);
        continue;
      }
      if (file.size > 30 * 1024 * 1024) { // 30MB hard limit pre-compression
        setErrors(e => [...e, `"${file.name}" est trop volumineux (max 30 MB avant compression)`]);
        continue;
      }

      try {
        // Client-side pre-compression
        const compressed = await compressImageClient(file);
        const preview = getPreviewUrl(compressed);
        newPending.push({
          id: `${Date.now()}-${Math.random()}`,
          file: compressed,
          preview,
          originalName: file.name,
          originalSize: file.size,
          compressedSize: compressed.size,
          status: 'ready', // ready | uploading | done | error
        });
      } catch (err) {
        setErrors(e => [...e, `Erreur lecture "${file.name}": ${err.message}`]);
      }
    }

    setPending(p => [...p, ...newPending]);
  }, [images.length, pending.length]);

  const onInputChange = (e) => handleFiles(e.target.files);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePending = (id) =>
    setPending(p => p.filter(f => f.id !== id));

  // ── Upload to server ─────────────────────────────────────

  const uploadAll = async () => {
    if (!pending.length || uploading) return;
    setUploading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      pending.forEach(p => formData.append('images', p.file, p.originalName));

      const res = await api.post(`/terrains/${terrainId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          // Could add progress bar here
        },
      });

      const newImages = [...images, ...res.data.data.uploaded];
      setImages(newImages);
      setPending([]);
      onImagesChange?.(newImages);
    } catch (err) {
      setErrors([err.response?.data?.message || "Erreur lors de l'upload"]);
    } finally {
      setUploading(false);
    }
  };

  // ── Delete existing image ────────────────────────────────

  const deleteImage = async (storageKey) => {
    try {
      const res = await api.delete(`/terrains/${terrainId}/images`, {
        data: { storageKey },
      });
      setImages(res.data.data);
      onImagesChange?.(res.data.data);
    } catch (err) {
      setErrors([err.response?.data?.message || 'Erreur suppression']);
    }
  };

  // ── Set main image ───────────────────────────────────────

  const setMain = async (storageKey) => {
    try {
      const res = await api.patch(`/terrains/${terrainId}/images/set-main`, { storageKey });
      setImages(res.data.data);
      onImagesChange?.(res.data.data);
    } catch (err) {
      setErrors([err.response?.data?.message || 'Erreur']);
    }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle size={12} /> {e}
            </p>
          ))}
        </div>
      )}

      {/* Existing images */}
      {images.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2">
            Images enregistrées ({images.length}/10)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.storage_key} className="relative group rounded-lg overflow-hidden border aspect-video bg-muted">
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${img.url}`}
                  alt="Terrain"
                  className="w-full h-full object-cover"
                />
                {/* Main badge */}
                {img.is_main && (
                  <div className="absolute top-1 left-1 bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Star size={10} /> Principal
                  </div>
                )}
                {/* Actions on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  {!img.is_main && (
                    <button
                      onClick={() => setMain(img.storage_key)}
                      className="bg-primary text-white rounded px-2 py-1 text-[10px] font-medium hover:bg-primary/80 flex items-center gap-1"
                      title="Définir comme image principale"
                    >
                      <Star size={10} /> Principal
                    </button>
                  )}
                  <button
                    onClick={() => deleteImage(img.storage_key)}
                    className="bg-destructive text-white rounded p-1.5 hover:bg-destructive/80"
                    title="Supprimer"
                  >
                    <X size={12} />
                  </button>
                </div>
                {/* Size info */}
                {img.size_bytes && (
                  <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded">
                    {formatBytes(img.size_bytes)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending (pre-upload) */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2">
            En attente d'upload ({pending.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {pending.map((p) => (
              <div key={p.id} className="relative rounded-lg overflow-hidden border-2 border-dashed border-primary/40 aspect-video bg-muted">
                <img src={p.preview} alt="" className="w-full h-full object-cover opacity-75" />
                <button
                  onClick={() => removePending(p.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                >
                  <X size={12} />
                </button>
                {/* Compression info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-1">
                  <span className="line-through opacity-60">{formatBytes(p.originalSize)}</span>
                  {' → '}
                  <span className="text-green-300 font-medium">{formatBytes(p.compressedSize)}</span>
                  <span className="opacity-60 ml-1">
                    (−{Math.round((1 - p.compressedSize / p.originalSize) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-3 w-full" onClick={uploadAll} disabled={uploading}>
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /> Upload en cours…</>
              : <><Upload size={14} /> Uploader {pending.length} image{pending.length > 1 ? 's' : ''}</>
            }
          </Button>
        </div>
      )}

      {/* Drop zone */}
      {images.length + pending.length < 10 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/40'
            }
          `}
        >
          <ImageIcon size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            {dragOver ? 'Relâchez pour ajouter' : 'Glissez vos images ici'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ou <span className="text-primary underline">parcourir</span> — JPG, PNG, WebP · Max 30 MB par image
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Les images sont automatiquement compressées et converties en WebP
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      )}

      {images.length + pending.length >= 10 && (
        <p className="text-xs text-center text-muted-foreground">Maximum de 10 images atteint.</p>
      )}
    </div>
  );
}
