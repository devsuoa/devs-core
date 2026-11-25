# DEVS Website

This repository contains the source code for the **DEVS (Developers Society) website** and the API behind it:

- `apps/web`: the website, built with **React, TypeScript, Tailwind CSS, and Vite**
- `apps/api`: the **Java / Spring Boot** API, the only thing that reads and writes the database
- `db`: database migrations, applied by Flyway in CI

Everything merged into `main` goes live on [dev.devsuoa.org](https://dev.devsuoa.org).

The project follows a component-first approach with shared design and development guidelines to ensure consistency across the site.

## Documentation

Find all documentation, including a setup guide in the [Knowledge Base](kb/home.md).

## Dependency Graph

Every module in the website (`apps/web/src`) and what it imports. The pre-commit hook regenerates this on each commit, so it stays up to date as the code changes. Run `pnpm graph` to regenerate it manually.

[![Dependency graph of apps/web/src](kb/assets/dependency-graph.svg)](kb/assets/dependency-graph.svg)
