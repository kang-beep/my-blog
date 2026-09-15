// tag_stats · tag_edges 집계 테이블 조회 및 재집계
import { supabase } from "@/shared/lib/supabaseClient";

export async function fetchTagCounts() {
  const { data, error } = await supabase
    .from("tag_stats")
    .select("tag, post_count")
    .order("post_count", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    tag: row.tag,
    count: row.post_count,
  }));
}

export async function fetchTagEdges() {
  const { data, error } = await supabase
    .from("tag_edges")
    .select("source_tag, target_tag, weight")
    .order("weight", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    source: row.source_tag,
    target: row.target_tag,
    weight: row.weight,
  }));
}

export async function fetchTagNetwork() {
  const [nodes, edges] = await Promise.all([fetchTagCounts(), fetchTagEdges()]);
  return { nodes, edges };
}

export async function refreshTagStats() {
  const { error } = await supabase.rpc("refresh_tag_stats");
  if (error) {
    throw new Error(error.message);
  }
}
