import { test } from "node:test";
import assert from "node:assert/strict";
import app from "../app";
import { database, userModel } from "../models/userModel";

test("login errors, user roles, sessions, revocation and GitHub users", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = "http://127.0.0.1:" + address.port;

  function browser() {
    let cookie = "";
    return async (path: string, data?: Record<string, string>) => {
      const response = await fetch(base + path, {
        method: data ? "POST" : "GET",
        redirect: "manual",
        headers: { cookie, ...(data ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
        body: data ? new URLSearchParams(data) : undefined,
      });
      const nextCookie = response.headers.get("set-cookie");
      if (nextCookie) cookie = nextCookie.split(";")[0];
      return response;
    };
  }

  try {
    const guest = browser();
    assert.equal((await guest("/dashboard")).headers.get("location"), "/auth/login");
    assert.equal((await guest("/admin")).headers.get("location"), "/auth/login");
    await guest("/auth/login", { email: "missing@example.com", password: "wrong" });
    assert.match(await (await guest("/auth/login")).text(), /find user with email: missing@example.com/);
    assert.doesNotMatch(await (await guest("/auth/login")).text(), /find user with email:/);
    await guest("/auth/login", { email: "jimmy123@gmail.com", password: "wrong" });
    assert.match(await (await guest("/auth/login")).text(), /Password is incorrect/);
    console.log("PASS: protected pages, unknown email, wrong password and one-time errors");

    const admin = browser();
    const user = browser();
    const secondUser = browser();
    assert.equal((await admin("/auth/login", { email: "jimmy123@gmail.com", password: "jimmy123!" })).headers.get("location"), "/dashboard");
    await user("/auth/login", { email: "johnny123@gmail.com", password: "johnny123!" });
    await secondUser("/auth/login", { email: "johnny123@gmail.com", password: "johnny123!" });
    assert.match(await (await user("/dashboard")).text(), /Welcome Johnny Doe/);
    assert.equal((await user("/admin")).status, 403);
    assert.equal((await user("/admin/revoke", { sessionId: "anything" })).status, 403);
    const html = await (await admin("/admin")).text();
    const sessions = [...html.matchAll(/name="sessionId" value="([^"]+)"/g)].map(match => match[1]);
    assert.equal(sessions.length, 3);
    const csrfToken = html.match(/name="csrfToken" value="([^"]+)"/)?.[1];
    assert.ok(csrfToken);
    assert.equal((await admin("/admin/revoke", { sessionId: sessions[1] })).status, 403);
    await admin("/admin/revoke", { sessionId: sessions[1], csrfToken });
    assert.equal((await user("/dashboard")).headers.get("location"), "/auth/login");
    assert.equal((await secondUser("/dashboard")).status, 200);
    console.log("PASS: admin-only page, three sessions, protected revoke and individual session revocation");

    database[1].name = "Updated Name";
    assert.match(await (await secondUser("/dashboard")).text(), /Welcome Updated Name/);
    database[1].name = "Johnny Doe";
    await secondUser("/auth/logout");
    assert.equal((await secondUser("/dashboard")).headers.get("location"), "/auth/login");
    await admin("/admin/revoke", { sessionId: sessions[0], csrfToken });
    assert.equal((await admin("/admin")).headers.get("location"), "/auth/login");
    console.log("PASS: current user data on next request, logout and admin self-revocation");

    const count = database.length;
    const githubUser = userModel.findOrCreateGithub("test-github-id", "GitHub Name");
    assert.equal(githubUser.role, "user");
    assert.equal(githubUser.email, undefined);
    assert.equal(githubUser.password, undefined);
    assert.equal(userModel.findOrCreateGithub("test-github-id", "New GitHub Name").id, githubUser.id);
    assert.equal(database.length, count + 1);
    database.pop();
    if (!process.env.GITHUB_CLIENT_ID) {
      await guest("/auth/github");
      assert.match(await (await guest("/auth/login")).text(), /GitHub login is not configured yet/);
    }
    console.log("PASS: GitHub account creation, repeat login lookup and missing configuration message");
    console.log("Live GitHub OAuth authorization requires the owner's credentials and was not tested.");
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
