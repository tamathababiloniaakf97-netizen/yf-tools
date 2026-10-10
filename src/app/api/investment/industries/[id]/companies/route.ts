import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeIndustryCompanyInput } from '@/lib/investment/industry-validation';
import type { IndustryCompanyInput } from '@/types/life-os';

async function ownedIndustry(supabase: Awaited<ReturnType<typeof createServerSideClient>>, userId: string, id: string) {
  return supabase.from('industry_profiles').select('id').eq('id', id).eq('user_id', userId).maybeSingle();
}
export async function GET(_: Request, context: RouteContext<'/api/investment/industries/[id]/companies'>) {
  const { id }=await context.params; const s=await createServerSideClient(); const {data:{user}}=await s.auth.getUser();
  if(!user)return NextResponse.json({error:'未登录'},{status:401});
  const {data,error}=await s.from('industry_companies').select('*').eq('user_id',user.id).eq('industry_profile_id',id).order('created_at');
  return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json(data??[]);
}
export async function POST(request:Request,context:RouteContext<'/api/investment/industries/[id]/companies'>){
  const{id}=await context.params;const s=await createServerSideClient();const{data:{user}}=await s.auth.getUser();
  if(!user)return NextResponse.json({error:'未登录'},{status:401});
  const {data:industry}=await ownedIndustry(s,user.id,id); if(!industry)return NextResponse.json({error:'行业研究不存在'},{status:404});
  const v=normalizeIndustryCompanyInput(await request.json() as IndustryCompanyInput);if(!v.ok)return NextResponse.json({error:v.errors.join('；')},{status:400});
  if(v.value.research_profile_id){const{data:linked}=await s.from('research_profiles').select('id').eq('id',v.value.research_profile_id).eq('user_id',user.id).maybeSingle();if(!linked)return NextResponse.json({error:'关联公司研究不存在'},{status:400});}
  const{data,error}=await s.from('industry_companies').insert({...v.value,user_id:user.id,industry_profile_id:id}).select().single();
  return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json(data,{status:201});
}
