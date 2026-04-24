import { useRef, useState } from 'react';
import { Upload, Trash2, FileText, Loader2, ExternalLink } from 'lucide-react';
import { terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export default function TerrainDocumentUploader({
  terrainId,
  existingDocuments = [],
  onDocumentsChange,
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    const res = await terrainsApi.listDocuments(terrainId);
    onDocumentsChange(res.data || []);
  };

  const handlePick = () => inputRef.current?.click();

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('documents', file));

      await terrainsApi.uploadDocuments(terrainId, formData);
      await refresh();
      e.target.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l’upload');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handleDelete = async (documentId) => {
    setLoading(true);
    setError(null);

    try {
      await terrainsApi.deleteDocument(terrainId, documentId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.xls,.xlsx,.txt"
        />

        <Button
          type="button"
          onClick={handlePick}
          className="rounded-2xl"
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Ajouter des documents
        </Button>
      </div>

      {!existingDocuments.length ? (
        <div className="rounded-[24px] border border-dashed bg-muted/20 px-6 py-10 text-center">
          <p className="text-sm font-medium">Aucun document</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoute ici les titres fonciers, études notariales, plans ou autres pièces.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {existingDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-2xl border bg-background/60 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {doc.original_name || doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.mime_type || 'document'} · {formatSize(doc.size_bytes)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                >
                  <ExternalLink size={14} />
                  Ouvrir
                </a>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={loading}
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}