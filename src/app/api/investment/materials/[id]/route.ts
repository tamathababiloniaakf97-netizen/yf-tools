import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeResearchMaterialInput } from '@/lib/investment/research-materials';
import type { ResearchMaterialInput } from '@/types/life-os';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = normalizeResearchMaterialInput(await request.json() as ResearchMaterialInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('research_materials').update({ ...validation.value, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { data: material, error: readError } = await supabase.from('research_materials').select('image_paths').eq('id', id).eq('user_id', user.id).single();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 404 });
  const imagePaths = Array.isArray(material.image_paths) ? material.image_paths as string[] : [];
  if (imagePaths.length) {
    const { error: storageError } = await supabase.storage.from('research-material-images').remove(imagePaths);
    if (storageError) return NextResponse.json({ error: `图片删除失败：${storageError.message}` }, { status: 500 });
  }
  const { error } = await supabase.from('research_materials').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
