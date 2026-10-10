import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressClientImage } from '../../utils/imageCompression';

interface PhotoUploadFieldProps {
  currentPhotoUrl?: string | null;
  selectedBlob: Blob | null;
  previewUrl: string | null;
  onPhotoSelected: (blob: Blob, previewUrl: string) => void;
  onPhotoRemoved: () => void;
  uploadProgress?: number | null; // e.g. 0 to 100 or null
  disabled?: boolean;
}

export const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  currentPhotoUrl,
  previewUrl,
  onPhotoSelected,
  onPhotoRemoved,
  uploadProgress = null,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const result = await compressClientImage(file);
      onPhotoSelected(result.blob, result.previewUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process selected image');
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input value so same file can be re-selected if desired
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const activeDisplayUrl = previewUrl || currentPhotoUrl;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-typewriter font-semibold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
        Identification Photo (Mugshot Dossier)
      </label>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileInputChange}
        disabled={disabled || isProcessing}
        className="hidden"
        aria-label="Upload photo file"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={onFileInputChange}
        disabled={disabled || isProcessing}
        className="hidden"
        aria-label="Capture photo from camera"
      />

      {/* Main Drag-and-Drop / Preview Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded p-3 transition-colors ${
          isDragging
            ? 'border-[#B3261E] bg-[#B3261E]/5'
            : 'border-[#D9D0BE] dark:border-[#2E323B] bg-[#FAF7F0] dark:bg-[#16181C]'
        } flex flex-col sm:flex-row items-center gap-3`}
      >
        {/* Preview Frame */}
        <div className="w-24 h-28 shrink-0 bg-[#E6DFCD] dark:bg-[#1F2228] border border-[#C5BBA6] dark:border-[#2C303A] rounded-xs relative overflow-hidden flex items-center justify-center shadow-inner">
          {activeDisplayUrl ? (
            <img
              src={activeDisplayUrl}
              alt="Mugshot Preview"
              width={96}
              height={112}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#7A6C58] dark:text-[#A09D95] p-2 text-center">
              <ImageIcon size={22} className="opacity-60 mb-1" />
              <span className="font-typewriter text-[9px] uppercase tracking-wider">No Photo</span>
            </div>
          )}

          {/* Processing / Uploading Overlay */}
          {(isProcessing || uploadProgress !== null) && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px] font-typewriter p-1 text-center">
              <Loader2 size={18} className="animate-spin mb-1" />
              <span>
                {uploadProgress !== null ? `Uploading ${uploadProgress}%` : 'Compressing...'}
              </span>
            </div>
          )}
        </div>

        {/* Controls and Upload Buttons */}
        <div className="flex-1 space-y-2 w-full text-center sm:text-left">
          <div className="text-[11px] font-typewriter text-[#7A7A7A] leading-tight">
            Drag and drop an official mugshot here, or click to browse. Max 4 MB (JPEG, PNG, WebP).
            Auto-compressed client-side.
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isProcessing}
              className="px-2.5 py-1 text-xs font-typewriter font-semibold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs transition-fast flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <UploadCloud size={13} />
              <span>Choose File</span>
            </button>

            {/* Mobile / camera capture button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled || isProcessing}
              className="px-2.5 py-1 text-xs font-typewriter border border-[#D9D0BE] dark:border-[#2E323B] bg-[#EFE9DC] dark:bg-[#1F2228] text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#E2DAC8] rounded-xs transition-fast flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="Capture from camera"
            >
              <Camera size={13} />
              <span>Camera</span>
            </button>

            {/* Remove photo button */}
            {(previewUrl || currentPhotoUrl) && (
              <button
                type="button"
                onClick={onPhotoRemoved}
                disabled={disabled || isProcessing}
                className="px-2.5 py-1 text-xs font-typewriter text-[#B3261E] hover:text-[#921E18] hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent rounded-xs transition-fast flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 size={12} />
                <span>Remove photo</span>
              </button>
            )}
          </div>

          {/* Progress bar if upload in progress */}
          {uploadProgress !== null && (
            <div className="w-full bg-[#E6DFCD] dark:bg-[#2C303A] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-[#B3261E] h-full transition-all duration-200"
                style={{ width: `${Math.max(5, uploadProgress)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-[#B3261E] text-xs font-typewriter">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
