import imageCompression from "browser-image-compression";
import { supabase } from "@/shared/lib/supabaseClient";
import { convertImageToWebp } from "@/shared/lib/imageToWebp";
import { formatStorageError } from "@/shared/lib/storageUpload";
import { STORAGE_BUCKETS } from "@/shared/constants/storage";

const MAX_IMAGE_SIZE_MB = 1;
const MAX_IMAGE_DIMENSION = 1920;

export async function uploadEditorImage(file: File, postId: string): Promise<string> {
  if (!postId) {
    throw new Error("본문 이미지 업로드에는 글 ID가 필요합니다.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: MAX_IMAGE_DIMENSION,
    useWebWorker: true,
  });

  const webpFile = await convertImageToWebp(compressed);
  const fileName = `${crypto.randomUUID()}.webp`;
  const filePath = `${postId}/content/${fileName}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKETS.POSTS).upload(filePath, webpFile, {
    upsert: false,
    contentType: "image/webp",
  });

  if (error) {
    throw new Error(formatStorageError(error));
  }

  const { data } = supabase.storage.from(STORAGE_BUCKETS.POSTS).getPublicUrl(filePath);
  return data.publicUrl;
}
