import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { buildMaterialSearchTerm, normalizeMaterialFilters, normalizeResearchMaterialInput } from '@/lib/investment/research-materials';
import type { ResearchMaterialInput } from '@/types/life-os';

export async function GET(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const filters = normalizeMaterialFilters(new URL(request.url).searchParams);
  let query = supabase.from('research_materials').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (filters.materialType) query = query.eq('material_type', filters.materialType);
  if (filters.assetName) query = query.eq('asset_name', filters.assetName);
  if (filters.query) {
    const term = buildMaterialSearchTerm(filters.query);
    query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%,source_name.ilike.%${term}%,asset_name.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const materials = await Promise.all((data ?? []).map(async (material) => {
    const paths = Array.isArray(material.image_paths) ? material.image_paths as string[] : [];
    if (!paths.length) return { ...material, image_urls: [] };
    const { data: signed } = await supabase.storage.from('research-material-images').createSignedUrls(paths, 3600);
    return { ...material, image_urls: signed?.map((item) => item.signedUrl).filter(Boolean) ?? [] };
  }));
  return NextResponse.json(materials);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = normalizeResearchMaterialInput(await request.json() as ResearchMaterialInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('research_materials').insert({ ...validation.value, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
