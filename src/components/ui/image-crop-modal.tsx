import { useEffect, useMemo, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { X } from "lucide-react";
import type { CropAreaPixels } from "@/lib/image-crop";
import "react-easy-crop/react-easy-crop.css";

type ImageCropModalProps = {
  open: boolean;
  imageSrc: string | null;
  title: string;
  description?: string;
  aspect: number;
  cropShape?: "rect" | "round";
  panelClassName?: string;
  cropAreaClassName?: string;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  saving?: boolean;
  confirmLabel?: string;
  savingLabel?: string;
  onClose: () => void;
  onSave: (cropAreaPixels: CropAreaPixels) => Promise<void> | void;
};

export function ImageCropModal({
  open,
  imageSrc,
  title,
  description,
  aspect,
  cropShape = "rect",
  panelClassName = "max-w-lg",
  cropAreaClassName = "h-[320px] w-full",
  minZoom = 1,
  maxZoom = 3,
  zoomStep = 0.01,
  saving = false,
  confirmLabel = "Guardar",
  savingLabel = "Guardando...",
  onClose,
  onSave,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  }, [open, imageSrc]);

  const effectiveSaving = saving || submitting;
  const normalizedDescription = useMemo(
    () => description ?? "Ajusta el encuadre y el nivel de zoom.",
    [description]
  );

  if (!open || !imageSrc) return null;

  const handleSave = async () => {
    if (!croppedArea || effectiveSaving) return;
    setSubmitting(true);
    try {
      await onSave(croppedArea);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
      <div
        className={`w-full rounded-2xl border border-white/10 bg-[#15101d] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${panelClassName}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-white/60">{normalizedDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/75 transition hover:bg-white hover:text-indigo-700"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div
            className={`relative overflow-hidden rounded-2xl border border-white/15 bg-black/40 ${cropAreaClassName}`}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              minZoom={minZoom}
              maxZoom={maxZoom}
              zoomSpeed={1}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) =>
                setCroppedArea(croppedAreaPixels)
              }
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Zoom</span>
              <span>{zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={zoomStep}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full accent-violet-400"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={effectiveSaving}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!croppedArea || effectiveSaving}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {effectiveSaving ? savingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
