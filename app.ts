import "dotenv/config";
import express, { ErrorRequestHandler } from "express";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import { randomBytes } from "crypto";
import path from "path";
import passportMiddleware from "./middleware/passportMiddleware";
import { sessionStore } from "./models/sessionStore";
import authRoute from "./routes/authRoute";
import indexRoute from "./routes/indexRoute";
import adminRoute from "./routes/adminRoute";

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(expressLayouts);
passportMiddleware(app);
app.use("/", indexRoute);
app.use("/auth", authRoute);
app.use("/admin", adminRoute);

const handleError: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error.message);
  res.status(500).send("Something went wrong. Please try again.");
};
app.use(handleError);

if (require.main === module) {
  const port = Number(process.env.PORT || 8000);
  app.listen(port, () => console.log("Server has started on port " + port));
}

export default app;
