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

// PUT /api/resources/[id] — 更新资源
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    // 替换 PDF 文件
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const sortOrder = parseInt(formData.get('sort_order') as string || '0', 10);

    // 获取旧记录以删除旧文件
    const { data: oldRecord } = await supabase
      .from('about_resources')
      .select('file_path')
      .eq('id', id)
      .single();

    if (file) {
      // 上传新文件
      const ext = file.name.split('.').pop() || 'pdf';
      const filePath = `resources/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      // 删除旧文件
      if (oldRecord?.file_path) {
        await supabase.storage.from('resources').remove([oldRecord.file_path]);
      }

      const { data: publicUrlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('about_resources')
        .update({
          title,
          description,
          url: publicUrlData.publicUrl,
          file_path: filePath,
          sort_order: sortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }
  }

  // 更新元数据（不含文件）
  const body = await request.json();
  const { title, description, url, sort_order } = body;

  const { data, error } = await supabase
    .from('about_resources')
    .update({
      title,
      description,
      url,
      sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/resources/[id] — 删除资源
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;

  // 先查出记录，如果有文件则删除
  const { data: record } = await supabase
    .from('about_resources')
    .select('file_path')
    .eq('id', id)
    .single();

  if (record?.file_path) {
    await supabase.storage.from('resources').remove([record.file_path]);
  }

  const { error } = await supabase
    .from('about_resources')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
