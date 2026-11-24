# Project Setup

This project is a **React + TypeScript + Tailwind CSS** web application built using **Vite**.  
This document explains how to set up the project locally and get it running for development.

## Tech Stack

- **React** – UI framework
- **TypeScript** – Type safety
- **Vite** – Development server and build tool
- **Tailwind CSS** – Utility-first styling
- **ESLint** – Code linting
- **Prettier** – Code formatting
- **Husky + lint-staged + commitlint** – Git hooks that check your code and commit messages

## Prerequisites

Make sure you have the following installed:

- **Node.js** 22 or 24
- **pnpm** (`corepack enable` sets up the right version automatically). Don't use npm: it ignores `pnpm-lock.yaml`
- **Git**
- **Docker** (runs the local database and API; only needed for `pnpm dev`, not `pnpm dev:web`)

Check versions:

```bash
node -v
pnpm -v
git --version
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/devsuoa/devsuoa-website.git
cd devsuoa-website
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies and sets up the Git hooks.

### 3. Start the Development Server

```bash
pnpm dev
```

This starts the local database and Java API in Docker, then the website at:
http://localhost:5173

`pnpm dev:web` starts only the website (pages that load data won't work), and `pnpm dev:stop` stops the Docker containers.

### Project Structure (High level)

```bash
apps/
  web/              This website
    src/
      components/   Reusable UI components
      pages/        Page-level components
      lib/          Data access and feature logic
      main.tsx      App entry point
    public/         Static assets
    .env            Your local environment variables (ask an exec for the values)
kb/                 Documentation (you are here)
scripts/            Repo tooling
```

Run `pnpm` scripts from the repo root. They forward to the right app.

> Keep components small, reusable, and typed.

### 4. Git hooks and useful scripts

These hooks run automatically when you commit:

- **pre-commit**: runs ESLint and Prettier on your staged files (auto-fixing what it can), then regenerates `kb/assets/dependency-graph.svg`
- **commit-msg**: checks your message follows the [commit guidelines](commit_guidelines.md), e.g. `feat: add construction page`, and rejects AI co-author lines
- **pre-push**: blocks AI agents (Claude Code, Cursor, Codex, Gemini, Copilot…) from pushing on their own. If you've told your agent to push, it reruns as `ALLOW_AGENT_PUSH=1 git push`

| Script           | What it does                                      |
| ---------------- | ------------------------------------------------- |
| `pnpm lint`      | Lint the whole repo (`pnpm lint:fix` to auto-fix) |
| `pnpm format`    | Format the whole repo with Prettier               |
| `pnpm typecheck` | Type-check without building                       |
| `pnpm graph`     | Regenerate the module dependency graph            |

If `kb/assets/dependency-graph.svg` has a merge conflict, run `pnpm graph` and stage the result instead of resolving it by hand.

### 5. Get building

Alanna and Baljot will align tasks to you on a centralised Google sheet. Update this sheet when you start and finish a task.
