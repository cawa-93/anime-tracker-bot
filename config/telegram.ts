import { load } from "https://deno.land/std/dotenv/mod.ts";

const env = await load();

export const BOT_KEY = env['BOT_KEY'] || Deno.env.get('BOT_KEY')
export const CHAT_ID = env['CHAT_ID'] || Deno.env.get('CHAT_ID')