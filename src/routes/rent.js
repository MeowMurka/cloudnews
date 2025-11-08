import express from "express";
import { supabaseAdmin } from "../supabase.js";

export const rent = express.Router();

function ensureAuth(req, res, next) {
  if (!req.session?.userId) return res.redirect("/login");
  next();
}

// Страница аренды (баланс + список слотов)
rent.get("/rent", ensureAuth, async (req, res) => {
  const userId = req.session.userId;

  const { data: balanceRow, error: balErr } =
    await supabaseAdmin
      .from("balances")
      .select("amount")
      .eq("user_id", userId)
      .maybeSingle();

  if (balErr) {
    console.error("GET /rent balances error:", balErr);
  }

  const { data: slots, error: slotsErr } =
    await supabaseAdmin
      .from("slots")
      .select("*")
      .order("id");

  if (slotsErr) {
    console.error("GET /rent slots error:", slotsErr);
  }

  return res.render("rent", {
    title: "Аренда",
    userId,
    balance: balanceRow?.amount ?? 0,
    slots: slots || []
  });
});

// Покупка блока — атомарно через SQL-функцию rent_slot
rent.post("/rent", ensureAuth, async (req, res) => {
  const userId = req.session.userId;
  const { slot_id, title, body, image_url } = req.body;
  const slotId = Number(slot_id);

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
