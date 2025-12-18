# Project Setup

This project is a **React + TypeScript + Tailwind CSS** web application built using **Vite**.  
This document explains how to set up the project locally and get it running for development.

## Tech Stack

- **React** – UI framework
- **TypeScript** – Type safety
- **Vite** – Development server and build tool
- **Tailwind CSS** – Utility-first styling
- **ESLint** – Code linting

## Prerequisites

Make sure you have the following installed:

- **Node.js** (LTS recommended)
- **npm** or **pnpm** (npm assumed below)
- **Git**

Check versions:

```bash
node -v
npm -v
git --version
```

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Gh05stt/devsuoa.git
cd devsuoa
```

### 2. Install Dependencies
```bash
npm install
```
This installs all required dependencies for React, TypeScript, Tailwind, and Vite.

### 3. Start the Development Server
```bash
npm run dev
```
The app will be available at:
http://localhost:5173

### Project Structure (High level)
```bash
src/
  components/     Reusable UI components
  pages/          Page-level components
  assets/         Images and static assets
  styles/         Global styles (Tailwind entry)
  main.tsx        App entry point
```
> Keep components small, reusable, and typed.

### 4. Get building
Alanna and Baljot will align tasks to you on a centralised Google sheet. Update this sheet when you start and finish a task.