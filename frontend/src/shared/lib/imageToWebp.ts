import imageCompression from "browser-image-compression";

const WEBP_QUALITY = 0.85;

export const IMAGE_UPLOAD_MAX_SIZE_MB = 1;
export const IMAGE_UPLOAD_MAX_DIMENSION = 1920;

export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: IMAGE_UPLOAD_MAX_SIZE_MB,
    maxWidthOrHeight: IMAGE_UPLOAD_MAX_DIMENSION,
    useWebWorker: true,
  });

  return convertImageToWebp(compressed);
}

export async function convertImageToWebp(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context를 생성하지 못했습니다.");
    }

    context.drawImage(image, 0, 0);

    const blob = await canvasToWebpBlob(canvas);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = src;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("WebP 변환에 실패했습니다."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      WEBP_QUALITY,
    );
  });
}
