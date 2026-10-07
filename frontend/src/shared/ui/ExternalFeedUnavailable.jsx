import { EXTERNAL_FEED_UNAVAILABLE_MESSAGE } from "@/shared/constants/externalFeed";

export default function ExternalFeedUnavailable({ message = EXTERNAL_FEED_UNAVAILABLE_MESSAGE }) {
  return (
    <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">{message}</p>
  );
}
