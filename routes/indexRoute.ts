import express from "express";
const router = express.Router();
import { ensureAuthenticated } from "../middleware/checkAuth";

router.get("/", (req, res) => {
  res.send(
    "<pre><strong>http://localhost:8000/auth/login</strong> for the login page. </pre><pre><strong>http://localhost:8000/dashboard</strong> for the dashboard (requires login).</pre>",
  );
});

router.get("/dashboard", ensureAuthenticated, (req, res) => {
  res.render("dashboard", {
    user: req.user,
  });
});

export default router;
