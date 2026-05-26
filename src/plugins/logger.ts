import { Elysia } from "elysia";

const COLORS = {
    reset: "\x1b[0m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    bold: "\x1b[1m",
};

function colorStatus(status: number): string {
    if (status >= 500) return `${COLORS.red}${status}${COLORS.reset}`;
    if (status >= 400) return `${COLORS.yellow}${status}${COLORS.reset}`;
    if (status >= 300) return `${COLORS.cyan}${status}${COLORS.reset}`;
    return `${COLORS.green}${status}${COLORS.reset}`;
}

function colorMethod(method: string): string {
    const colors: Record<string, string> = {
        GET: COLORS.green,
        POST: COLORS.cyan,
        PUT: COLORS.yellow,
        PATCH: COLORS.magenta,
        DELETE: COLORS.red,
    };
    const color = colors[method] ?? COLORS.gray;
    return `${color}${method.padEnd(6)}${COLORS.reset}`;
}

function formatDuration(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

export const loggerPlugin = new Elysia({ name: "logger-plugin" })
    .state("requestStartTime", 0)
    .onRequest(({ store }) => {
        store.requestStartTime = performance.now();
    })
    .onAfterResponse({ as: "global" }, ({ request, set, store }) => {
        const duration = performance.now() - (store as { requestStartTime: number }).requestStartTime;
        const url = new URL(request.url);
        const status = typeof set.status === "number" ? set.status : 200;
        const timestamp = new Date().toISOString();

        console.log(
            `${COLORS.gray}[${timestamp}]${COLORS.reset} ${colorMethod(request.method)} ${colorStatus(status)} ${COLORS.bold}${url.pathname}${COLORS.reset}${url.search} ${COLORS.gray}(${formatDuration(duration)})${COLORS.reset}`,
        );
    });
