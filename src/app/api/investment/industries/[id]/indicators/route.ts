import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeIndustryIndicatorInput } from '@/lib/investment/industry-validation';
import type { IndustryIndicatorInput } from '@/types/life-os';

export async function GET(_:Request,context:RouteContext<'/api/investment/industries/[id]/indicators'>){const{id}=await context.params;const s=await createServerSideClient();const{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:'未登录'},{status:401});const{data,error}=await s.from('industry_indicators').select('*').eq('industry_profile_id',id).eq('user_id',user.id).order('created_at');return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json(data??[]);}
export async function POST(request:Request,context:RouteContext<'/api/investment/industries/[id]/indicators'>){
  const{id}=await context.params;const s=await createServerSideClient();const{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:'未登录'},{status:401});
  const {data:industry}=await s.from('industry_profiles').select('id').eq('id',id).eq('user_id',user.id).maybeSingle();if(!industry)return NextResponse.json({error:'行业研究不存在'},{status:404});
  const v=normalizeIndustryIndicatorInput(await request.json() as IndustryIndicatorInput);if(!v.ok)return NextResponse.json({error:v.errors.join('；')},{status:400});
  const{data,error}=await s.from('industry_indicators').insert({...v.value,user_id:user.id,industry_profile_id:id}).select().single();return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json(data,{status:201});
}
