import { createClient } from "@supabase/supabase-js";

export function createServiceSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  return createClient(supabaseUrl, supabaseSecretKey);
}

export function getUtcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function shouldSkipDelete() {
  return process.env.SKIP_DELETE === "true";
}

export async function clearRowsForDate(supabase, table, filters) {
  let query = supabase.from(table).delete();

  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }

  const { error } = await query;
  if (error) {
    throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}

export async function deleteRowsBeforeDate(supabase, table, fetchedDate, extraFilters = {}) {
  let query = supabase.from(table).delete().lt("fetched_date", fetchedDate);

  for (const [column, value] of Object.entries(extraFilters)) {
    query = query.eq(column, value);
  }

  const { error } = await query;
  if (error) {
    throw new Error(`Failed to delete old rows from ${table}: ${error.message}`);
  }
}

export async function insertRows(supabase, table, rows) {
  if (rows.length === 0) {
    return;
  }

  const chunkSize = 100;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);

    if (error) {
      throw new Error(`Failed to insert into ${table}: ${error.message}`);
    }
  }
}
