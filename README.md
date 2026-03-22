# ElysiaJS Boilerplate

A robust, production-ready boilerplate for building fast web applications and APIs using [ElysiaJS](https://elysiajs.com/) and [Bun](https://bun.sh/). This template includes built-in security features, authentication, Prisma ORM integration, and a modular folder structure.

## 🚀 Features

- **Blazing Fast**: Built on top of Bun and ElysiaJS.
- **Security First**: 
  - CORS, Rate Limiting, and Security Headers (Helmet-like).
  - **Request Anomaly Detection**: Deep scanning of Query Params, Headers, URL Paths, and Body payloads to block SQL Injection, XSS, Path Traversal, Command Injection, LDAP Injection, NoSQL Injection, Null Bytes, dan Prototype Pollution.
  - **Suspicious File Probing Block**: Automatically blocks bots/scanners trying to access `.php`, `.env`, `.sql`, etc.
- **Authentication**: JWT-based login, registration, and middleware protection ready to use.
- **Database Integrated**: Pre-configured with Prisma ORM (PostgreSQL).
- **Modular Architecture**: Built with maintainability and scalability in mind.

## 📁 Folder Structure

```text
elysiajs-boilerplate/
├── prisma/               # Prisma schema and database migrations
├── src/
│   ├── config/           # Environment variables loader & configuration files
│   ├── generated/        # Auto-generated files (e.g., Prisma Client)
│   ├── lib/              # Shared helper functions, utilities, and integrations (e.g., Prisma instance, responses)
│   ├── middlewares/      # Global or reusable middlewares (e.g., Auth middleware)
│   ├── modules/          # Feature-based modules (Domain-Driven Design approach)
│   │   ├── auth/         # Auth module (Controller, Service, Repository, Model, Routes)
│   │   └── users/        # Users module (CRUD operations)
│   ├── plugins/          # Elysia plugins (Security setup, Request Guard, Swagger)
│   ├── views/            # Static HTML views (if rendering pages)
│   └── index.ts          # Main application entry point & router registration
├── .env.example          # Example environment variables
├── package.json          # Project dependencies and scripts
└── README.md             # This file
```

## 🛠 Getting Started

To get started with this template, simply clone the repository:

```bash
git clone https://github.com/muhamadgibran16/elysiajs-boilerplate.git
cd elysiajs-boilerplate
```

Install dependencies using Bun:
```bash
bun install
```

Set up your environment variables:
```bash
cp .env.example .env
```
*(Make sure to update the `DATABASE_URL` in `.env` to point to your actual database)*

Push the database schema:
```bash
bunx --bun prisma db push
```

## 💻 Development

To start the development server run:
```bash
bun run dev
```

- **API Server**: http://localhost:3000/
- **Swagger Documentation**: http://localhost:3000/swagger

## 🛡 Security Rules (Request Guard)

This boilerplate comes with a built-in `request-guard.ts` plugin that automatically runs on every request. It catches malicious payloads without any external dependencies by utilizing regex matching for:

1. SQL Injection (`' OR 1=1`, `UNION SELECT`)
2. Cross-Site Scripting / XSS (`<script>`, `javascript:`, `onerror=`)
3. Command Injection (`; rm -rf`, `whoami`)
4. Directory/Path Traversal (`../../../etc/passwd`)
5. NoSQL Injection (`$gt`, `$ne`)
6. Prototype Pollution (`__proto__`, `constructor`)
7. Scanner/Bot User-Agent Detection (`sqlmap`, `nikto`, `nmap`)
8. Blocked HTTP Methods (`TRACE`, `CONNECT`)

*Note: The Request Body scanner intentionally skips XSS checks to accommodate legitimate rich-text/HTML inputs from clients.*