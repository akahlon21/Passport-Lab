import { Strategy as GitHubStrategy, Profile } from "passport-github2";
import { PassportStrategy } from "../../interfaces";
import { userModel } from "../../models/userModel";

export default function createGithubStrategy(): PassportStrategy | undefined {
  const clientID = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientID || !clientSecret) {
    return undefined;
  }

  const strategy = new GitHubStrategy(
    {
      clientID,
      clientSecret,
      callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:8000/auth/github/callback",
      state: "enabled",
    },
    (accessToken: string, refreshToken: string, profile: Profile, done: (error: Error | null, user?: Express.User) => void) => {
      const name = profile.displayName || profile.username || "GitHub user";
      const user = userModel.findOrCreateGithub(profile.id, name);
      done(null, user);
    }
  );
  return { name: "github", strategy };
}
