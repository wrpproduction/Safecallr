import { uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Client-side image optimization utilities.
 * Ensures cross-browser compatibility (Firefox, Chrome, Safari) and avoids
 * Firestore 1MB document size limit / Express payload size errors by compressing images.
 */

export interface CompressionResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  originalSizeKB: number;
  compressedSizeKB: number;
}

export async function compressImage(
  file: File,
  maxWidth = 512,
  maxHeight = 512,
  quality = 0.85
): Promise<CompressionResult> {
  const originalSizeKB = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("Le fichier sélectionné n'est pas une image valide."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Erreur de lecture du fichier par le navigateur."));
    };

    reader.onload = (event) => {
      const srcDataUrl = event.target?.result as string;
      if (!srcDataUrl) {
        reject(new Error("Impossible d'extraire les données de l'image."));
        return;
      }

      const img = new Image();

      // Firefox crossOrigin handling
      img.crossOrigin = "anonymous";

      img.onerror = () => {
        reject(new Error("Erreur lors du chargement de l'image pour compression."));
      };

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Calculate aspect ratio fit within maxWidth & maxHeight
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Impossible d'initialiser le Canvas 2D."));
            return;
          }

          // Clear background for PNG transparency support
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Use PNG if transparent or originally PNG, otherwise JPEG
          const isPng = file.type === "image/png" || file.type === "image/svg+xml";
          const outputType = isPng ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outputType, isPng ? undefined : quality);

          // Convert to Blob for Firebase Storage or API upload
          canvas.toBlob(
            (blob) => {
              const finalBlob = blob || new Blob([dataUrl], { type: outputType });
              const compressedSizeKB = Math.round(finalBlob.size / 1024);

              resolve({
                dataUrl,
                blob: finalBlob,
                width,
                height,
                originalSizeKB,
                compressedSizeKB,
              });
            },
            outputType,
            quality
          );
        } catch (err: any) {
          reject(new Error("Erreur lors du traitement Canvas: " + err.message));
        }
      };

      img.src = srcDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Creates a cropped image from source URL and Cropper pixel coordinates.
 * Returns compressed Blob and Data URL fit for avatar/logo display.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputWidth = 512,
  outputHeight = 512,
  quality = 0.88
): Promise<CompressionResult> {
  const image = new Image();
  image.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (e) => reject(new Error("Erreur de chargement de l'image pour le recadrage."));
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible d'initialiser le Canvas 2D pour le recadrage.");
  }

  // Clear background for crisp output
  ctx.clearRect(0, 0, outputWidth, outputHeight);

  // Draw cropped image region onto the canvas scaled to target size
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  const outputType = "image/jpeg";
  const dataUrl = canvas.toDataURL(outputType, quality);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        const finalBlob = blob || new Blob([dataUrl], { type: outputType });
        const compressedSizeKB = Math.round(finalBlob.size / 1024);
        resolve({
          dataUrl,
          blob: finalBlob,
          width: outputWidth,
          height: outputHeight,
          originalSizeKB: Math.round(dataUrl.length / 1024),
          compressedSizeKB,
        });
      },
      outputType,
      quality
    );
  });
}

/**
 * Robust wrapper around Firebase Storage uploadBytes with a non-blocking timeout race.
 * If Firebase Storage is slow, offline, or unconfigured, it rejects after timeoutMs (default 3000ms),
 * allowing the app to fall back instantly to compressed Base64 Data URL without spinning indefinitely.
 */
export async function uploadStorageWithTimeout(
  storageRef: any,
  fileOrBlob: Blob | File,
  timeoutMs = 3000
): Promise<string> {
  const uploadPromise = (async () => {
    const uploadResult = await uploadBytes(storageRef, fileOrBlob);
    return await getDownloadURL(uploadResult.ref);
  })();

  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error("Firebase Storage non disponible ou délai dépassé")), timeoutMs)
  );

  return Promise.race([uploadPromise, timeoutPromise]);
}

