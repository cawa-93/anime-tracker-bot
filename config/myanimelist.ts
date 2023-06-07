import { load } from "https://deno.land/std/dotenv/mod.ts";

const env = await load();

export const CLIENT_ID = env['MAL_CLIENT_ID']
export const USER_NAME = env['MAL_USER_NAME']