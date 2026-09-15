export default function HomeFeedBadge({ variant = "external", children }) {
  const className =
    variant === "mine" ? "home-feed-badge home-feed-badge-mine" : "home-feed-badge home-feed-badge-external";

  return <span className={className}>{children}</span>;
}
