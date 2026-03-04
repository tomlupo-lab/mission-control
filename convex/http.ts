import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const FEED_API_KEY = process.env.FEED_API_KEY ?? "";

function checkAuth(request: Request): boolean {
  if (!FEED_API_KEY) return true; // no key configured = open (dev mode)
  const auth = request.headers.get("Authorization");
  if (auth === `Bearer ${FEED_API_KEY}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("key") === FEED_API_KEY) return true;
  return false;
}

// POST /api/feed/push — push a new feed item
http.route({
  path: "/api/feed/push",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
    const body = await request.json();
    const { source, category, title, body: itemBody, actionUrl, actionLabel } = body;
    if (!source || !category || !title) {
      return new Response(
        JSON.stringify({ error: "source, category, and title are required" }),
        { status: 400 }
      );
    }
    const id = await ctx.runMutation(api.feed.push, {
      source,
      category,
      title,
      body: itemBody,
      actionUrl,
      actionLabel,
    });
    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }),
});

// GET /api/feed — list feed items
http.route({
  path: "/api/feed",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
    const url = new URL(request.url);
    const category = url.searchParams.get("category") ?? undefined;
    const unreadOnly = url.searchParams.get("unread") === "true";
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const items = await ctx.runQuery(api.feed.list, { category, unreadOnly, limit });
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }),
});

// POST /api/feed/mark-read — mark item(s) as read
http.route({
  path: "/api/feed/mark-read",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
    const body = await request.json();
    if (body.all) {
      const count = await ctx.runMutation(api.feed.markAllRead, {
        category: body.category,
      });
      return new Response(JSON.stringify({ ok: true, marked: count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (body.id) {
      await ctx.runMutation(api.feed.markRead, { id: body.id });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "id or all required" }), { status: 400 });
  }),
});

// CORS preflight
http.route({
  path: "/api/feed/push",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }),
});

http.route({
  path: "/api/feed",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }),
});

http.route({
  path: "/api/feed/mark-read",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }),
});

export default http;
