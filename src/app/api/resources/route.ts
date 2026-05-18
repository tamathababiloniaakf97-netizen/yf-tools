import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

async function isAdmin(supabase: Awaited<ReturnType<typeof createServerSideClient>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin';
}

// GET /api/resources — 公开获取所有资源
export async function GET() {
  const supabase = await createServerSideClient();
  const { data, error } = await supabase
    .from('about_resources')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/resources — 管理员创建资源（支持 multipart PDF 或 JSON 链接）
export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    // PDF 上传
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const sortOrder = parseInt(formData.get('sort_order') as string || '0', 10);

    if (!file || !title) {
      return NextResponse.json({ error: '缺少文件或标题' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const filePath = `resources/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('about_resources')
      .insert({
        type: 'pdf',
        title,
        description,
        url: publicUrlData.publicUrl,
        file_path: filePath,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('resources POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  // 外部链接
  const body = await request.json();
  const { title, description, url, sort_order } = body;

  if (!title || !url) {
    return NextResponse.json({ error: '缺少标题或链接' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('about_resources')
    .insert({
      type: 'link',
      title,
      description: description || '',
      url,
      file_path: null,
      sort_order: sort_order || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('resources POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
