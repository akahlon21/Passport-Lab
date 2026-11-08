import { test } from "node:test";
import assert from "node:assert/strict";

test("GitHub redirect has random state and rejects an invalid callback", async () => {
  process.env.GITHUB_CLIENT_ID = "test-client-id";
  process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
  const { default: app } = await import("../app");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = "http://127.0.0.1:" + address.port;
  try {
    const first = await fetch(base + "/auth/github", { redirect: "manual" });
    const url = new URL(first.headers.get("location")!);
    assert.equal(url.origin, "https://github.com");
    assert.equal(url.pathname, "/login/oauth/authorize");
    assert.equal(url.searchParams.get("client_id"), "test-client-id");
    assert.ok(url.searchParams.get("state"));
    const second = await fetch(base + "/auth/github", { redirect: "manual" });
    const secondUrl = new URL(second.headers.get("location")!);
    assert.notEqual(url.searchParams.get("state"), secondUrl.searchParams.get("state"));
    const invalid = await fetch(base + "/auth/github/callback?code=fake&state=wrong", {
      redirect: "manual",
      headers: { cookie: first.headers.get("set-cookie")!.split(";")[0] },
    });
    assert.equal(invalid.headers.get("location"), "/auth/login");
    console.log("PASS: GitHub authorization redirect, unique state and invalid-state rejection (test credentials)");
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
