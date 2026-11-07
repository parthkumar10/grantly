import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp, groundedAnswer } from "../server/index.mjs";
test("assistant facts are constructed from the catalog, unknown IDs produce no claims", () => {
  assert.equal(groundedAnswer([999], ["benefits"]).sources.length, 0);
  const a = groundedAnswer([101], ["benefits", "deadlines"]);
  assert.match(a.answer, /50,000/);
  assert.match(a.answer, /2026-11-30/);
  assert.ok(
    a.sources.every((s) => s.url.startsWith("https://scholarships.gov.in/")),
  );
});
test("configuration reports only fully configured integrations", async () => {
  const keys = [
    "GEMINI_API_KEY",
    "GEMINI_MODEL",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_MODEL = "gemini-test";
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    let response = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api/config",
    );
    let config = await response.json();
    assert.equal(config.geminiConfigured, false);
    assert.equal(config.supabaseConfigured, false);

    process.env.GEMINI_API_KEY = "test-placeholder-not-a-key";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    response = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api/config",
    );
    config = await response.json();
    assert.equal(config.geminiConfigured, true);
    assert.equal(config.supabaseConfigured, true);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
test("API rejects invalid input and reports missing keys without pretending to call AI", async () => {
  const old = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    let r = await fetch(base + "/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "" }),
    });
    assert.equal(r.status, 400);
    r = await fetch(base + "/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "How do I apply?", scholarshipId: 101 }),
    });
    assert.equal(r.status, 503);
    assert.match((await r.json()).error, /not configured/);
    r = await fetch(base + "/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://untrusted.example",
      },
      body: JSON.stringify({ question: "Hello" }),
    });
    assert.equal(r.status, 403);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    if (old) process.env.GEMINI_API_KEY = old;
  }
});

test("Render external URL is the assistant origin fallback when APP_ORIGIN is unset", async () => {
  const keys = ["APP_ORIGIN", "RENDER_EXTERNAL_URL", "GEMINI_API_KEY"];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  delete process.env.APP_ORIGIN;
  delete process.env.GEMINI_API_KEY;
  process.env.RENDER_EXTERNAL_URL = "https://grantly.onrender.com";
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    let response = await fetch(base + "/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: process.env.RENDER_EXTERNAL_URL,
      },
      body: JSON.stringify({ question: "How do I apply?", scholarshipId: 101 }),
    });
    assert.equal(response.status, 503);
    response = await fetch(base + "/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://other.example",
      },
      body: JSON.stringify({ question: "How do I apply?", scholarshipId: 101 }),
    });
    assert.equal(response.status, 403);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("Gemini routing ignores invented answer text and unrecognized facts", async () => {
  const oldKey = process.env.GEMINI_API_KEY,
    oldModel = process.env.GEMINI_MODEL,
    oldRequire = process.env.AI_REQUIRE_AUTH;
  process.env.GEMINI_API_KEY = "test-placeholder-not-a-key";
  process.env.GEMINI_MODEL = "test-model";
  process.env.AI_REQUIRE_AUTH = "false";
  const nativeFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input, options) => {
    if (
      String(input) ===
      "https://generativelanguage.googleapis.com/v1beta/interactions"
    ) {
      calls++;
      const request = JSON.parse(options.body);
      assert.equal(request.model, "test-model");
      assert.equal(request.store, false);
      assert.equal(request.response_format.mime_type, "application/json");
      return new Response(
        JSON.stringify({
          status: "completed",
          steps: [
            {
              type: "model_output",
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    ids: [101, 999],
                    topics: ["benefits", "invented"],
                    answer: "You have won 999999 rupees",
                  }),
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return nativeFetch(input, options);
  };
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    const response = await nativeFetch(
      "http://127.0.0.1:" + server.address().port + "/api/assistant",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "What is the benefit?",
          scholarshipId: 101,
        }),
      },
    );
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(calls, 1);
    assert.match(result.answer, /50,000/);
    assert.ok(!result.answer.includes("999999"));
    assert.ok(!result.answer.includes("won"));
  } finally {
    globalThis.fetch = nativeFetch;
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const [key, value] of Object.entries({
      GEMINI_API_KEY: oldKey,
      GEMINI_MODEL: oldModel,
      AI_REQUIRE_AUTH: oldRequire,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("assistant explains Gemini model capacity errors", async () => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = "test-placeholder-not-a-key";
  process.env.GEMINI_MODEL = "test-model";
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: { code: "service_unavailable" },
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    const response = await nativeFetch(
      "http://127.0.0.1:" + server.address().port + "/api/assistant",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "What documents do I need?",
          scholarshipId: 101,
        }),
      },
    );
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /temporarily busy/);
  } finally {
    globalThis.fetch = nativeFetch;
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const [key, value] of Object.entries({
      GEMINI_API_KEY: oldKey,
      GEMINI_MODEL: oldModel,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
test("assistant limits repeated requests", async () => {
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    let response;
    for (let i = 0; i < 11; i++)
      response = await fetch(
        "http://127.0.0.1:" + server.address().port + "/api/assistant",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
    assert.equal(response.status, 429);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
