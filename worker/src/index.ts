/**
 * blog-views Worker
 *
 * Endpoints:
 *   GET /v/<slug>   文章 PV 自增并返回 {pv}
 *   GET /v/site     整站 PV 自增 + 当日 UV 哈希累加，返回 {pv, uv}
 *
 * KV key 布局：
 *   pv:<slug>              uint  文章 PV 累计
 *   site:pv                uint  整站 PV 累计
 *   site:uv                uint  整站 UV 历史归档累计（昨日及之前）
 *   uv_today:<YYYYMMDD>    set 模拟（每个 hash 一个 key："uv_today:<date>:<hash>"）
 */

export interface Env {
    VIEWS: KVNamespace;
    SALT_SECRET: string;
}

const ALLOWED_ORIGIN = "https://www.chenxiaosheng.com";
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
        const origin = request.headers.get("Origin") || "";

        if (path === "/v/site") {
            return withCors(await handleSite(request, env), origin);
        }

        if (path.startsWith("/v/")) {
            const slug = path.slice(3);
            if (!SLUG_RE.test(slug)) {
                return withCors(json({ error: "invalid slug" }, 400), origin);
            }
            return withCors(await handleSlug(slug, env), origin);
        }

        return new Response("Not Found", { status: 404 });
    },

    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        // 每日归档昨日 UV 到 site:uv
        const yesterday = ymd(new Date(Date.now() - 24 * 3600 * 1000));
        const prefix = `uv_today:${yesterday}:`;

        // 列出所有昨日 hash key
        let cursor: string | undefined = undefined;
        let count = 0;
        const keysToDelete: string[] = [];
        do {
            const list = await env.VIEWS.list({ prefix, cursor });
            count += list.keys.length;
            for (const k of list.keys) keysToDelete.push(k.name);
            cursor = list.list_complete ? undefined : list.cursor;
        } while (cursor);

        if (count === 0) return; // 幂等：已归档或当天无访问

        const curTotal = parseInt((await env.VIEWS.get("site:uv")) || "0", 10);
        await env.VIEWS.put("site:uv", String(curTotal + count));

        // 删除昨日所有 UV hash key
        for (const key of keysToDelete) {
            ctx.waitUntil(env.VIEWS.delete(key));
        }
    },
};

async function handleSlug(slug: string, env: Env): Promise<Response> {
    const key = `pv:${slug}`;
    let cur = 0;
    try {
        cur = parseInt((await env.VIEWS.get(key)) || "0", 10);
        await env.VIEWS.put(key, String(cur + 1));
        return json({ pv: cur + 1 });
    } catch (e) {
        return json({ pv: 0 });
    }
}

async function handleSite(request: Request, env: Env): Promise<Response> {
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const today = ymd(new Date());

    // PV
    let sitePv = 0;
    try {
        sitePv = parseInt((await env.VIEWS.get("site:pv")) || "0", 10);
        await env.VIEWS.put("site:pv", String(sitePv + 1));
        sitePv += 1;
    } catch (e) {
        sitePv = 0;
    }

    // UV：hash(ip + date + salt)，已存在则跳过写入
    let siteUvTotal = 0;
    let todayCount = 0;
    try {
        siteUvTotal = parseInt((await env.VIEWS.get("site:uv")) || "0", 10);
        const hash = await sha256Hex(`${ip}|${today}|${env.SALT_SECRET || ""}`);
        const uvKey = `uv_today:${today}:${hash}`;
        const existed = await env.VIEWS.get(uvKey);
        if (!existed) {
            await env.VIEWS.put(uvKey, "1", { expirationTtl: 60 * 60 * 48 }); // 48h 兜底 TTL
        }

        // 当日 UV size：list prefix 数一次
        todayCount = await countPrefix(env, `uv_today:${today}:`);
    } catch (e) {
        siteUvTotal = 0;
        todayCount = 0;
    }

    return json({ pv: sitePv, uv: siteUvTotal + todayCount });
}

async function countPrefix(env: Env, prefix: string): Promise<number> {
    let cursor: string | undefined = undefined;
    let total = 0;
    do {
        const list = await env.VIEWS.list({ prefix, cursor });
        total += list.keys.length;
        cursor = list.list_complete ? undefined : list.cursor;
    } while (cursor);
    return total;
}

function withCors(resp: Response, origin: string): Response {
    const headers = new Headers(resp.headers);
    if (origin === ALLOWED_ORIGIN) {
        headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    }
    headers.set("Cache-Control", "no-store");
    return new Response(resp.body, { status: resp.status, headers });
}

function json(body: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
    });
}

function ymd(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}${m}${day}`;
}

async function sha256Hex(input: string): Promise<string> {
    const buf = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
