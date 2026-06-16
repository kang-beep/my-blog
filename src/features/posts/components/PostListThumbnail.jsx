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

  return <div className={`${THUMBNAIL_CLASS_NAME} bg-slate-50`} aria-hidden />;
}
