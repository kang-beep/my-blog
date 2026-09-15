import { supabase } from "@/shared/lib/supabaseClient";
import { prepareImageForUpload } from "@/shared/lib/imageToWebp";
import { formatStorageError } from "@/shared/lib/storageUpload";
import { STORAGE_BUCKETS } from "@/shared/constants/storage";

export async function uploadEditorImage(file: File, postId: string): Promise<string> {
  if (!postId) {
    throw new Error("본문 이미지 업로드에는 글 ID가 필요합니다.");
  }

  const webpFile = await prepareImageForUpload(file);
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
