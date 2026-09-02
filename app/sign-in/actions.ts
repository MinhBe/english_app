'use server';
import { createClient } from '@/lib/supabase/server';
export async function signIn(_: {error:string}, formData:FormData){
 const email=String(formData.get('email')??'').trim(); const password=String(formData.get('password')??'');
 const supabase=await createClient(); const {error}=await supabase.auth.signInWithPassword({email,password});
 return error?{error:'Email hoặc mật khẩu không đúng.'}:{error:''};
}
