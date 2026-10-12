import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import type { HouseholdItemType } from '@/types/household-finance';

const itemTables: Record<HouseholdItemType,string> = {
  account:'household_accounts', asset:'household_assets', liability:'household_liabilities',
};
function validType(value:unknown): value is HouseholdItemType {
  return value === 'account' || value === 'asset' || value === 'liability';
}

export async function GET() {
  const supabase=await createServerSideClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:'未登录'},{status:401});
  const {data,error}=await supabase.from('household_item_categories').select('*').eq('user_id',user.id).order('item_type').order('created_at');
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data??[]);
}

export async function POST(request:Request) {
  const supabase=await createServerSideClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:'未登录'},{status:401});
  const body=await request.json() as {item_type?:unknown;name?:string};
  const name=body.name?.trim()||'';
  if(!validType(body.item_type)||!name)return NextResponse.json({error:'请填写有效的类别名称'},{status:400});
  const {data,error}=await supabase.from('household_item_categories').insert({user_id:user.id,item_type:body.item_type,name,is_active:true}).select().single();
  if(error?.code==='23505')return NextResponse.json({error:'同类项目中已存在这个类别'},{status:409});
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data,{status:201});
}

export async function PATCH(request:Request) {
  const supabase=await createServerSideClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:'未登录'},{status:401});
  const body=await request.json() as {id?:string;name?:string;is_active?:boolean};
  if(!body.id)return NextResponse.json({error:'无效类别'},{status:400});
  const values:Record<string,string|boolean>={};
  if(body.name!==undefined){const name=body.name.trim();if(!name)return NextResponse.json({error:'类别名称不能为空'},{status:400});values.name=name;}
  if(body.is_active!==undefined)values.is_active=Boolean(body.is_active);
  if(Object.keys(values).length===0)return NextResponse.json({error:'没有需要更新的内容'},{status:400});
  const {data,error}=await supabase.from('household_item_categories').update(values).eq('id',body.id).eq('user_id',user.id).select().maybeSingle();
  if(error?.code==='23505')return NextResponse.json({error:'同类项目中已存在这个类别'},{status:409});
  if(error)return NextResponse.json({error:error.message},{status:500});
  if(!data)return NextResponse.json({error:'类别不存在或无权操作'},{status:404});
  if(values.name){
    const {error:itemError}=await supabase.from(itemTables[data.item_type as HouseholdItemType]).update({category:values.name}).eq('category_id',data.id).eq('user_id',user.id);
    if(itemError)return NextResponse.json({error:itemError.message},{status:500});
  }
  return NextResponse.json(data);
}
