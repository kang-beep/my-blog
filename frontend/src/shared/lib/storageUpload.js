const IMAGE_CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function resolveImageContentType(file, extension) {
  if (file.type && file.type.startsWith("image/")) {
    return file.type;
  }
  return IMAGE_CONTENT_TYPES[extension] ?? "image/jpeg";
}

export function getImageExtension(fileName) {
  if (!fileName.includes(".")) {
    return "jpg";
  }
  return fileName.split(".").pop().toLowerCase();
}

export function formatStorageError(error) {
  if (!error) {
    return "Storage upload failed.";
  }
  const parts = [error.message];
  if (error.statusCode) {
    parts.push(`status ${error.statusCode}`);
  }
  return parts.filter(Boolean).join(" · ");
}
