const VISITOR_ID_STORAGE_KEY = "portfolio_visitor_id";

export function getOrCreateVisitorId() {
  const existing = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const visitorId = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
  return visitorId;
}
