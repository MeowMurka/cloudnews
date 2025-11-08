import express from "express";
import { supabaseAdmin } from "../supabase.js";


export const rent = express.Router();


function ensureAuth(req, res, next) {
if (!req.session.userId) return res.redirect("/login");
next();
}


rent.get("/rent", ensureAuth, async (req, res) => {
const userId = req.session.userId;
const { data: balanceRow } = await supabaseAdmin.from("balances").select("amount").eq("user_id", userId).maybeSingle();
const { data: slots } = await supabaseAdmin.from("slots").select("*").order("id");
res.render("rent", { balance: balanceRow?.amount ?? 0, slots: slots || [] });
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