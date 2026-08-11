import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, ZoomOut, Check, RotateCcw, Loader2, Crop } from "lucide-react";
import { getCroppedImg, CompressionResult } from "../lib/imageUtils";

interface ImageCropperModalProps {
  imageSrc: string | null;
  cropShape?: "round" | "rect";
  title?: string;
  onCancel: () => void;
  onCropComplete: (result: CompressionResult) => void;
}

export default function ImageCropperModal({
  imageSrc,
  cropShape = "round",
  title = "Ajuster et recadrer la photo",
  onCancel,
  onCropComplete,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((cropLocation: { x: number; y: number }) => {
    setCrop(cropLocation);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleCropComplete = useCallback(
    (_croppedArea: any, pixels: any) => {
      setCroppedAreaPixels(pixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedResult = await getCroppedImg(imageSrc, croppedAreaPixels, 512, 512);
      onCropComplete(croppedResult);
    } catch (err) {
      console.error("Cropping error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0F1B3D] border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B1528]/80">
          <div className="flex items-center gap-2.5 text-white font-bold">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Crop size={18} />
            </div>
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropper Stage */}
        <div className="relative w-full h-80 bg-black/90 select-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={handleCropComplete}
            classes={{
              containerClassName: "rounded-none",
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-6 bg-[#0F1B3D] space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Dézoomer"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Zoomer"
            >
              <ZoomIn size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setCrop({ x: 0, y: 0 });
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Réinitialiser"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Déplacez et zoomez l'image pour positionner parfaitement le visage ou le logo dans le cercle.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-sm transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Valider et Appliquer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
