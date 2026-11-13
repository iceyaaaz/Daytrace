begin;

-- 按字面搜索。strpos 不把 %、_ 或反斜杠解释为通配符。
-- 以调用者身份读取，沿用 records 已有的行级访问规则。
create or replace function public.search_records(keyword text)
returns setof public.records
language sql stable security invoker
set search_path = ''
as $$
  select record.*
  from public.records as record
  where length(keyword) > 0 and (
    strpos(lower(record.content), lower(keyword)) > 0
    or strpos(lower(record.gain), lower(keyword)) > 0
    or exists (
      select 1 from unnest(record.tags) as tag(name)
      where strpos(lower(tag.name), lower(keyword)) > 0
    )
  );
$$;

revoke execute on function public.search_records(text) from public, anon;
grant execute on function public.search_records(text) to authenticated;

commit;
