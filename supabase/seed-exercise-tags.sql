-- 建好唯一一个日记账号后执行一次。重复运行会重新添加手动删除的预置标签。
do $$
declare
  owner_id uuid;
begin
  select id into strict owner_id from auth.users;
  insert into public.tags (user_id, category, name)
  select owner_id, 'exercise', name
  from unnest(array['跑步', '力量训练', '散步', '球类', '瑜伽']) as names(name)
  on conflict (user_id, category, name) do nothing;
end;
$$;
