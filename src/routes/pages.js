import express from "express";
import { supabaseAdmin } from "../supabase.js";

export const pages = express.Router();

pages.get("/", async (req, res) => {
  const { data: slots } = await supabaseAdmin.from("slots").select("*").order("id");
  const { data: placements } = await supabaseAdmin
    .from("placements")
    .select("id, slot_id, title, body, image_url, is_active, expires_at")
    .eq("is_active", true);

  const map = new Map();
  (placements || []).forEach(p => map.set(p.slot_id, p));

  res.render("index", {
    title: "Главная",
    userId: req.session.userId,
    slots: slots || [],
    placements: map
  });
});

pages.get("/login", (_req, res) => res.render("login", { title: "Вход" }));
pages.get("/register", (_req, res) => res.render("register", { title: "Регистрация" }));

pages.post("/logout", (req, res) => { req.session.destroy(() => res.redirect("/")); });
