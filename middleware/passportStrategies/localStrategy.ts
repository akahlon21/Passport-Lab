import { Strategy as LocalStrategy } from "passport-local";
import { getUserByEmail } from "../../controllers/userController";
import { PassportStrategy } from "../../interfaces";

const localStrategy = new LocalStrategy(
  { usernameField: "email", passwordField: "password" },
  (email, password, done) => {
    const user = getUserByEmail(email);
    if (!user) {
      return done(null, false, { message: "Couldn't find user with email: " + email });
    }
    if (user.password !== password) {
      return done(null, false, { message: "Password is incorrect" });
    }
    return done(null, user);
  }
);

const passportLocalStrategy: PassportStrategy = { name: "local", strategy: localStrategy };
export default passportLocalStrategy;
