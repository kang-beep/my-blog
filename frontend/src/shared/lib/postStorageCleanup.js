import { supabase } from "@/shared/lib/supabaseClient";
import { STORAGE_BUCKETS } from "@/shared/constants/storage";
import { formatStorageError } from "@/shared/lib/storageUpload";

const STORAGE_REMOVE_BATCH_SIZE = 100;
const STORAGE_LIST_LIMIT = 1000;

function isStorageFolder(item) {
  return !item?.metadata;
}

async function collectStorageFilePaths(bucket, folderPath) {
  const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
    limit: STORAGE_LIST_LIMIT,
  });

  if (error) {
    throw new Error(formatStorageError(error));
  }

  if (!data?.length) {
    return [];
  }

  const paths = [];
  for (const item of data) {
    const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
    if (isStorageFolder(item)) {
      const nestedPaths = await collectStorageFilePaths(bucket, itemPath);
      paths.push(...nestedPaths);
      continue;
    }
    paths.push(itemPath);
  }

  return paths;
}

async function removeStoragePaths(bucket, paths) {
  for (let index = 0; index < paths.length; index += STORAGE_REMOVE_BATCH_SIZE) {
    const batch = paths.slice(index, index + STORAGE_REMOVE_BATCH_SIZE);
    const { error } = await supabase.storage.from(bucket).remove(batch);
    if (error) {
      throw new Error(formatStorageError(error));
    }
  }
}

export async function deletePostStorageFiles(postId) {
  if (!postId) {
    return;
  }

  const bucket = STORAGE_BUCKETS.POSTS;
  const paths = await collectStorageFilePaths(bucket, postId);
  if (paths.length === 0) {
    return;
  }

  await removeStoragePaths(bucket, paths);
}
