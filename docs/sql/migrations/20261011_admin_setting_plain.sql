-- Non-secret admin settings (e.g. gemini_output_language) are returned unmasked
-- from list_admin_secrets. API keys remain masked.
-- Also provides get_admin_setting(p_key) for allowlisted plain reads.

create or replace function public.list_admin_secrets()
returns table (
  key text,
  is_set boolean,
  masked_value text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    s.key,
    true as is_set,
    case
      when s.key = any (array['gemini_output_language']::text[]) then s.value
      else public.mask_admin_secret(s.value)
    end as masked_value,
    s.updated_at
  from public.admin_secrets s
  order by s.key;
$$;

create or replace function public.get_admin_setting(p_key text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed constant text[] := array['gemini_output_language'];
  stored text;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'key is required';
  end if;
  if not (trim(p_key) = any (allowed)) then
    raise exception 'Setting key is not readable: %', trim(p_key);
  end if;

  select s.value into stored
  from public.admin_secrets s
  where s.key = trim(p_key);

  return stored;
end;
$$;

revoke all on function public.get_admin_setting(text) from public, anon;
grant execute on function public.get_admin_setting(text) to authenticated;

notify pgrst, 'reload schema';
