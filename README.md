# honoapi

A backend REST API built with **Hono.js** on **Cloudflare Workers**, using **Neon** (serverless Postgres) via **Drizzle ORM**.

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Framework  | [Hono](https://hono.dev)       |
| Runtime    | Cloudflare Workers             |
| Database   | Neon (serverless Postgres)     |
| ORM        | Drizzle ORM                   |

## Project Structure

```
honoapi/
├── src/
│   ├── index.ts              # App entry point & middleware setup
│   ├── types/
│   │   └── bindings.ts       # Cloudflare Worker env bindings types
│   ├── db/
│   │   ├── client.ts         # Neon + Drizzle client factory
│   │   └── schema.ts         # Drizzle table definitions
│   ├── middleware/
│   │   ├── cors.ts           # CORS middleware
│   │   └── db.ts             # DB injection middleware
│   └── routes/
│       ├── users.ts          # CRUD routes for /api/users
│       └── posts.ts          # CRUD routes for /api/posts
├── drizzle/                  # Generated migrations (gitignored if desired)
├── drizzle.config.ts         # Drizzle Kit config
├── wrangler.toml             # Cloudflare Workers config
└── package.json
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up your Neon database

1. Create a project at [neon.tech](https://neon.tech)
2. Copy your connection string
3. Create a `.dev.vars` file (used by Wrangler locally):

```
DATABASE_URL=postgres://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Run migrations

```bash
npm run db:generate   # generate SQL migration files
npm run db:migrate    # apply migrations to Neon
```

### 4. Start local dev server

```bash
npm run dev
```

## API Endpoints

### Health

| Method | Path      | Description     |
|--------|-----------|-----------------|
| GET    | `/`       | Status check    |
| GET    | `/health` | Health ping     |

### Users `/api/users`

| Method | Path            | Description      |
|--------|-----------------|------------------|
| GET    | `/api/users`    | List all users   |
| GET    | `/api/users/:id`| Get user by ID   |
| POST   | `/api/users`    | Create user      |
| PATCH  | `/api/users/:id`| Update user      |
| DELETE | `/api/users/:id`| Delete user      |

### Posts `/api/posts`

| Method | Path            | Description      |
|--------|-----------------|------------------|
| GET    | `/api/posts`    | List all posts   |
| GET    | `/api/posts/:id`| Get post by ID   |
| POST   | `/api/posts`    | Create post      |
| PATCH  | `/api/posts/:id`| Update post      |
| DELETE | `/api/posts/:id`| Delete post      |

## Deployment

```bash
# Set your DATABASE_URL secret in Cloudflare
wrangler secret put DATABASE_URL

# Deploy to Cloudflare Workers
npm run deploy
```

## Scripts

| Script            | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start local dev server               |
| `npm run deploy`  | Deploy to Cloudflare Workers         |
| `npm run db:generate` | Generate Drizzle migrations      |
| `npm run db:migrate`  | Apply migrations to Neon         |
| `npm run db:studio`   | Open Drizzle Studio (DB GUI)     |
