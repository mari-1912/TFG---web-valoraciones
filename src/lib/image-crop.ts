export type CropAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CreateCroppedImageArgs = {
  imageSrc: string;
  cropAreaPixels: CropAreaPixels;
  outputWidth?: number;
  outputHeight?: number;
  type?: string;
  quality?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = src;
  });
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("No se pudo generar el recorte de imagen."));
      },
      type,
      quality
    );
  });
}

export async function createCroppedImage({
  imageSrc,
  cropAreaPixels,
  outputWidth,
  outputHeight,
  type = "image/jpeg",
  quality = 0.9,
}: CreateCroppedImageArgs): Promise<{ blob: Blob; dataUrl: string }> {
  const image = await loadImage(imageSrc);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  const sourceX = Math.max(
    0,
    Math.min(naturalWidth - 1, Math.round(cropAreaPixels.x))
  );
  const sourceY = Math.max(
    0,
    Math.min(naturalHeight - 1, Math.round(cropAreaPixels.y))
  );
  const sourceWidth = Math.max(
    1,
    Math.min(naturalWidth - sourceX, Math.round(cropAreaPixels.width))
  );
  const sourceHeight = Math.max(
    1,
    Math.min(naturalHeight - sourceY, Math.round(cropAreaPixels.height))
  );

  const targetWidth = Math.max(1, Math.round(outputWidth ?? sourceWidth));
  const targetHeight = Math.max(1, Math.round(outputHeight ?? sourceHeight));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar el recorte de imagen.");
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const blob = await toBlob(canvas, type, quality);
  const dataUrl = canvas.toDataURL(type, quality);
  return { blob, dataUrl };
}
