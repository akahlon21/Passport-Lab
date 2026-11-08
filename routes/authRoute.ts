import express, { RequestHandler } from "express";
import passport from "passport";
import { forwardAuthenticated } from "../middleware/checkAuth";

const router = express.Router();

router.get("/login", forwardAuthenticated, (req, res) => {
  const messages = req.session.messages || [];
  delete req.session.messages;
  res.render("login", { messages });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/dashboard",
  failureRedirect: "/auth/login",
  failureMessage: true,
}));

const checkGithub: RequestHandler = (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    req.session.messages = ["GitHub login is not configured yet."];
    res.redirect("/auth/login");
    return;
  }
  next();
};

router.get("/github", forwardAuthenticated, checkGithub, passport.authenticate("github"));
router.get("/github/callback", checkGithub, passport.authenticate("github", {
  successRedirect: "/dashboard",
  failureRedirect: "/auth/login",
  failureMessage: "GitHub login failed. Please try again.",
}));

router.get("/logout", (req, res, next) => {
  req.logout(error => {
    if (error) return next(error);
    req.session.destroy(error => {
      if (error) return next(error);
      res.clearCookie("connect.sid");
      res.redirect("/auth/login");
    });
  });
});

export default router;
