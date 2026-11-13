const recordColumns = 'id,record_date,category,tags,content,gain,minutes,created_at,updated_at';
const summaryColumns = 'id,record_date,category,tags,minutes';
const tagColumns = 'id,category,name';

export function createRepository(client) {
  async function listRecords({ start, end, summary = false } = {}, signal) {
    const records = [];
    let cursor;

    // 以日期和 ID 为游标，同一天有超过一页记录也不会被跳过。
    for (;;) {
      let query = client.from('records').select(summary ? summaryColumns : recordColumns)
        .order('record_date').order('id').limit(1000);
      if (start) query = query.gte('record_date', start);
      if (end) query = query.lte('record_date', end);
      if (cursor) {
        const { record_date: date, id } = cursor;
        query = query.or(`record_date.gt.${date},and(record_date.eq.${date},id.gt.${id})`);
      }
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      if (data.length === 0) return records;
      records.push(...data);
      cursor = data.at(-1);
    }
  }

  async function searchRecords(keyword, page = 0, signal) {
    const term = keyword.trim();
    if (!term) return { records: [], more: false };
    const pageSize = 30;
    const start = page * pageSize;
    let query = client.rpc('search_records', { keyword: term }).select(recordColumns)
      .order('record_date', { ascending: false }).order('id').range(start, start + pageSize);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) throw error;
    return { records: data.slice(0, pageSize), more: data.length > pageSize };
  }

  async function hasRecordsBefore(date, signal) {
    const { data, error } = await client.from('records').select('id')
      .lt('record_date', date).limit(1).abortSignal(signal);
    if (error) throw error;
    return data.length > 0;
  }

  async function saveRecord(id, draftId, date, values) {
    const records = client.from('records');
    const query = id
      ? records.update({ ...values, updated_at: new Date().toISOString() }).eq('id', id)
      // 同一份草稿重试时使用同一个 ID，避免网络中断后产生重复记录。
      : records.upsert({ ...values, id: draftId, record_date: date });
    const { error } = await query.select('id').single();
    if (error) throw error;
  }

  async function deleteRecord(id) {
    const { error } = await client.from('records').delete().eq('id', id).select('id').single();
    if (error) throw error;
  }

  async function listTags(signal) {
    const tags = [];
    let cursor;
    for (;;) {
      let query = client.from('tags').select(tagColumns).order('id').limit(1000);
      if (cursor) query = query.gt('id', cursor);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      if (data.length === 0) return tags.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      tags.push(...data);
      cursor = data.at(-1).id;
    }
  }

  async function createTag(category, name) {
    const { data, error } = await client.from('tags').insert({ category, name }).select(tagColumns).single();
    if (error) throw error;
    return data;
  }

  async function deleteTag(id) {
    const { error } = await client.from('tags').delete().eq('id', id).select('id').single();
    if (error) throw error;
  }

  return { listRecords, searchRecords, hasRecordsBefore, saveRecord, deleteRecord, listTags, createTag, deleteTag };
}
