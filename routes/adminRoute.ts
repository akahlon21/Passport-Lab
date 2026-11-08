import express from "express";
import { randomBytes } from "crypto";
import { ensureAuthenticated, ensureAdmin } from "../middleware/checkAuth";
import { sessionStore } from "../models/sessionStore";

const router = express.Router();
router.use(ensureAuthenticated, ensureAdmin);

router.get("/", (req, res, next) => {
  sessionStore.all((error, sessions) => {
    if (error) return next(error);
    const activeSessions = Object.entries(sessions || {})
      .filter(([, session]) => session.passport?.user !== undefined)
      .map(([id, session]) => ({ id, userId: session.passport?.user }));
    req.session.csrfToken ||= randomBytes(24).toString("hex");
    res.render("admin", { user: req.user, sessions: activeSessions, csrfToken: req.session.csrfToken });
  });
});

router.post("/revoke", (req, res, next) => {
  if (!req.session.csrfToken || req.body.csrfToken !== req.session.csrfToken) {
    res.status(403).send("Invalid request.");
    return;
  }
  const sessionId: unknown = req.body.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    res.status(400).send("A session ID is required.");
    return;
  }
  sessionStore.destroy(sessionId, error => {
    if (error) return next(error);
    if (sessionId === req.sessionID) {
      req.session.destroy(error => {
        if (error) return next(error);
        res.clearCookie("connect.sid");
        res.redirect("/auth/login");
      });
      return;
    }
    res.redirect("/admin");
  });
});

export default router;
