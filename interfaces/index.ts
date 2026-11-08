import { Strategy } from "passport";

export interface PassportStrategy {
  name: string;
  strategy: Strategy;
}

export interface User {
  id: number;
  name: string;
  email?: string;
  password?: string;
  githubId?: string;
  role: "user" | "admin";
}

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      role: "user" | "admin";
    }
  }
}

declare module "express-session" {
  interface SessionData {
    messages?: string[];
    passport?: { user: number };
    csrfToken?: string;
  }
}
