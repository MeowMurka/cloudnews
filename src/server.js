import express from "express";
import { pages } from "./routes/pages.js";
import { rent } from "./routes/rent.js";
import { startCron } from "./cron.js";
import { registerUser, loginUser } from "./auth.js";
import { fileURLToPath } from 'url';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = process.env.PORT || 3000;


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));
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


// Аутентификация (простые формы)
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


app.get("/metrics", metricsHandler);
app.use(pages);
app.use(rent);


startCron();


app.listen(port, () => console.log(`CloudNews listening on ${port}`));
