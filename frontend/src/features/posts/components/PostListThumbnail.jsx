import { ImageOff } from "lucide-react";

const THUMBNAIL_CLASS_NAME =
  "h-14 w-14 shrink-0 rounded-lg border border-slate-200 sm:h-16 sm:w-16";

export default function PostListThumbnail({ src }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${THUMBNAIL_CLASS_NAME} object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${THUMBNAIL_CLASS_NAME} flex items-center justify-center border-dashed bg-slate-50 text-slate-300`}
      role="img"
      aria-label="대표 이미지 없음"
    >
      <ImageOff size={22} strokeWidth={1.5} aria-hidden />
    </div>
  );
}
