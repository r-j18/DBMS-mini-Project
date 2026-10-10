export interface CompressionResult {
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * Compresses an image client-side before uploading:
 * - Validates MIME type (JPEG, PNG, WebP)
 * - Verifies input file <= 4 MB
 * - Resizes to max 800px on the longest dimension
 * - Re-encodes as WebP (or JPEG fallback) at ~0.8 quality
 */
export async function compressClientImage(file: File): Promise<CompressionResult> {
  // 1. Client-side MIME validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please select a JPEG, PNG, or WebP image.');
  }

  // 2. Client-side hard size check: max 4 MB
  if (file.size > 4 * 1024 * 1024) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 4 MB.`
    );
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Scale down to max 800px on the longest side
      let targetWidth = img.width;
      let targetHeight = img.height;
      const maxDim = 800;

      if (targetWidth > maxDim || targetHeight > maxDim) {
        if (targetWidth >= targetHeight) {
          targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
          targetWidth = maxDim;
        } else {
          targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
          targetHeight = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Browser canvas context could not be initialized.'));
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const finish = (finalBlob: Blob) => {
        if (finalBlob.size > 4 * 1024 * 1024) {
          return reject(new Error('Compressed image still exceeds the 4 MB upload limit.'));
        }
        const previewUrl = URL.createObjectURL(finalBlob);
        resolve({
          blob: finalBlob,
          previewUrl,
          originalSize: file.size,
          compressedSize: finalBlob.size,
          width: targetWidth,
          height: targetHeight,
        });
      };

      // Try encoding to WebP first
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to JPEG if WebP is unsupported
            canvas.toBlob(
              (jpegBlob) => {
                if (!jpegBlob) {
                  return reject(new Error('Failed to encode compressed image.'));
                }
                finish(jpegBlob);
              },
              'image/jpeg',
              0.8
            );
            return;
          }
          finish(blob);
        },
        'image/webp',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read image file. It may be corrupt or not a valid image.'));
    };

    img.src = objectUrl;
  });
}
