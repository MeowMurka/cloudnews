import cron from "node-cron";
import { supabaseAdmin } from "./supabase.js";
import { activePlacements } from "./metrics.js";


export function startCron() {
// Каждые 5 минут деактивируем просроченные
cron.schedule("*/5 * * * *", async () => {
const now = new Date().toISOString();
await supabaseAdmin.from("placements")
.update({ is_active: false })
.lt("expires_at", now)
.eq("is_active", true);


const { count } = await supabaseAdmin
.from("placements")
.select("id", { count: "exact", head: true })
.eq("is_active", true);
if (typeof count === "number") activePlacements.set(count);
});
}