import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { rateLimit } from 'elysia-rate-limit';

export const securityPlugin = new Elysia({ name: 'security-plugin' })
    // 1. CORS Configuration
    .use(
        cors({
            origin: true, // You can specify allowed origins here, e.g., ['https://example.com']
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        })
    )

    // 2. Rate Limiting Configuration
    // Limits requests to 100 per IP address per 15 minutes by default
    .use(
        rateLimit({
            duration: 15 * 60 * 1000,
            max: 100,
            errorResponse: new Response("Too many requests, please try again later.", { status: 429 }),
        })
    )

    // 3. Security Headers (Helmet-like)
    .onRequest(({ set }) => {
        // Prevents the browser from doing MIME-type sniffing
        set.headers['X-Content-Type-Options'] = 'nosniff';

        // Prevents the page from being displayed in a frame, iframe, embed, or object
        set.headers['X-Frame-Options'] = 'DENY';

        // Enables the Cross-Site Scripting (XSS) filter built into most modern web browsers
        set.headers['X-XSS-Protection'] = '1; mode=block';

        // Enforces secure (HTTP over SSL/TLS) connections to the server
        set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';

        // Controls how much referrer information (sent with the Referer header) should be included with requests
        set.headers['Referrer-Policy'] = 'no-referrer-when-downgrade';

        // Content Security Policy
        set.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none';";
    });
