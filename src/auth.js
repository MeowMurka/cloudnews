import bcrypt from "bcrypt";
import { supabaseAdmin } from "./supabase.js";
import { v4 as uuidv4 } from "uuid";


export async function registerUser(email, password) {
// Создаём пользователя через Admin API (серверный ключ)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
email,
password,
email_confirm: true
});
if (error) throw error;
const userId = data.user.id;
// Профиль + баланс
await supabaseAdmin.from("profiles").insert({ id: userId, role: "user" });
await supabaseAdmin.from("balances").insert({ user_id: userId, amount: 0 });
return userId;
}


export async function loginUser(email, password) {
const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
if (error) throw error;
return data.session.user.id;
}