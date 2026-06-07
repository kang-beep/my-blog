// 태그 집계/관계 데이터 조회 함수 모음
import { supabase } from "@/shared/lib/supabaseClient";

export async function fetchTagCounts() {
  const { data, error } = await supabase.from("posts").select("tags");
  if (error) {
    throw new Error(error.message);
  }

  const countMap = new Map();
  (data ?? []).forEach((row) => {
    (row.tags ?? []).forEach((tag) => {
      countMap.set(tag, (countMap.get(tag) ?? 0) + 1);
    });
  });

  return [...countMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchTagEdges() {
  const { data, error } = await supabase.from("posts").select("tags");
  if (error) {
    throw new Error(error.message);
  }

  const edgeMap = new Map();
  (data ?? []).forEach((row) => {
    const tags = [...new Set(row.tags ?? [])];
    for (let i = 0; i < tags.length; i += 1) {
      for (let j = i + 1; j < tags.length; j += 1) {
        const [source, target] = [tags[i], tags[j]].sort();
        const key = `${source}__${target}`;
        edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
      }
    }
  });

  return [...edgeMap.entries()]
    .map(([key, weight]) => {
      const [source, target] = key.split("__");
      return { source, target, weight };
    })
    .sort((a, b) => b.weight - a.weight);
}
