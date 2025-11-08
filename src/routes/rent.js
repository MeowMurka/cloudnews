import express from "express";
import { supabaseAdmin } from "../supabase.js";

export const rent = express.Router();

function ensureAuth(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

rent.post("/rent", ensureAuth, async (req, res) => {
  const userId = req.session.userId;
  const { slot_id, title, body, image_url } = req.body;
  const slotId = Number(slot_id);

  // простая валидация
  if (!Number.isFinite(slotId) || slotId <= 0) {
    return res.status(400).send("Некорректный слот");
  }

  try {
    const { error } = await supabaseAdmin.rpc("rent_slot", {
      p_user: userId,
      p_slot_id: slotId,
      p_title: (title || "").trim(),
      p_body: (body || "").trim(),
      p_image_url: (image_url || "").trim()
    });

    if (error) {
      console.error("rent_slot error:", error);
      const msg = /Insufficient funds/i.test(error.message)
        ? "Недостаточно средств"
        : error.message;
      return res.status(400).send("Ошибка покупки: " + msg);
    }

    return res.redirect("/");
  } catch (e) {
    console.error("rent POST unexpected:", e);
    return res.status(500).send("Внутренняя ошибка");
  }
});


rent.post("/rent", ensureAuth, async (req, res) => {
  const userId = req.session.userId;
  const { slot_id, title, body, image_url } = req.body;
  const slotId = Number(slot_id);

  const { data: slot } = await supabaseAdmin.from("slots").select("*").eq("id", slotId).single();
  if (!slot) return res.status(400).send("Unknown slot");

  const { data: bal } = await supabaseAdmin.from("balances").select("amount").eq("user_id", userId).single();
  if ((bal?.amount ?? 0) < slot.price) return res.status(400).send("Недостаточно средств");

  const starts = new Date();
  const expires = new Date(starts.getTime() + 24 * 60 * 60 * 1000);

  // Снять деньги и создать размещение (простая последовательность)
  await supabaseAdmin.from("balances").update({ amount: bal.amount - slot.price }).eq("user_id", userId);
  await supabaseAdmin.from("placements").insert({
    slot_id: slotId,
    user_id: userId,
    title,
    body,
    image_url: image_url || null,
    starts_at: starts.toISOString(),
    expires_at: expires.toISOString(),
    is_active: true
  });

  res.redirect("/");
});
