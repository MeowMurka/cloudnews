import express from "express";
import session from "express-session";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import expressLayouts from "express-ejs-layouts";

import { pages } from "./routes/pages.js";
import { rent } from "./routes/rent.js";
import { startCron } from "./cron.js";
import { registerUser, loginUser } from "./auth.js";
import { httpRequestDuration, metricsHandler } from "./metrics.js";

const app = express();
const port = process.env.PORT || 3000;

// EJS + лэйауты
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(expressLayouts);
app.set("layout", "layout"); // views/layout.ejs

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(session({
  secret: process.env.SESSION_SECRET || "changeme",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Метрики мидлвар
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method });
  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";
    end({ route, status_code: res.statusCode });
  });
  next();
});

// Регистрация / Логин
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const id = await registerUser(email, password);
    req.session.userId = id;
    res.redirect("/rent");
  } catch (e) {
    res.status(400).send("Ошибка регистрации: " + e.message);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const id = await loginUser(email, password);
    req.session.userId = id;
    res.redirect("/rent");
  } catch (e) {
    res.status(400).send("Ошибка входа: " + e.message);
  }
});

// Метрики и роуты
app.get("/metrics", metricsHandler);
app.use(pages);
app.use(rent);

// Крон
startCron();

app.listen(port, () => console.log(`CloudNews listening on ${port}`));
