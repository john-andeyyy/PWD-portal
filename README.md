# PWD Portal Monorepo

This repository contains the PWD President portal monorepo:

- `apps/web`: Next.js frontend using Tailwind CSS and a shared component library
- `apps/api`: NestJS backend with Prisma and MySQL
- `packages/ui`: shared UI utilities and components

## Local development

Install dependencies:

```bash
pnpm install
```

Run the frontend:

```bash
pnpm dev:web
```

Run the backend:

```bash
pnpm dev:api
```

Run lint across the repo:

```bash
pnpm lint
```

Run build for all packages:

```bash
pnpm build
```

## Vercel deployment

The repo is configured for monorepo deployment through `vercel.json`.

## Environment

Copy `.env.example` to `.env` and update the values for your MySQL database and JWT secret.
