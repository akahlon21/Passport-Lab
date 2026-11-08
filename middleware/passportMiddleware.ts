import { Application } from "express";
import passport from "passport";
import PassportConfig from "./PassportConfig";
import localStrategy from "./passportStrategies/localStrategy";
import createGithubStrategy from "./passportStrategies/githubStrategy";
import { getUserById } from "../controllers/userController";

const passportMiddleware = (app: Application): void => {
  const strategies = [localStrategy];
  const githubStrategy = createGithubStrategy();
  if (githubStrategy) {
    strategies.push(githubStrategy);
  }
  new PassportConfig(strategies);

  passport.serializeUser<number>((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser<number>((id, done) => {
    done(null, getUserById(id) || false);
  });

  app.use(passport.initialize());
  app.use(passport.session());
};

export default passportMiddleware;
