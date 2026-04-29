// 포트폴리오 프로젝트 조회/관리 API
import { supabase } from "../../../shared/lib/supabaseClient";

export async function fetchPortfolioProjects() {
  const { data, error } = await supabase
    .from("portfolio_projects")
    .select(
      "id, title, slug, summary, content, tech_stack, repo_url, demo_url, image_url, featured, sort_order, created_at"
    )
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((item) => ({
    ...item,
    tech_stack: Array.isArray(item.tech_stack) ? item.tech_stack : [],
  }));
}
