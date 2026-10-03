import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: '请选择图片' }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: '仅支持 JPEG、PNG 或 WebP 图片' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: '单张图片不能超过 5 MB' }, { status: 400 });
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('research-material-images').upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path }, { status: 201 });
}
