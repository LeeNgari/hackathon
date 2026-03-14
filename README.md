## Fieldwork Platform

Fieldwork is a modern, web-based learning platform where students complete **real-world work tickets** instead of watching passive lectures. It is designed for **students**, **instructors**, and **companies** to collaborate around practical, portfolio-ready work that can be verified by employers.

The application is built as a **single-page React app** powered by **Vite** and **Tailwind CSS**, with a strong focus on responsive layouts, smooth interactions, and production-grade UI patterns.

---

## Features

- **Student experience**
  - Browse and enroll in courses built around real workplace tickets.
  - Complete tickets that mirror genuine job scenarios from partner companies.
  - Track progress with clear completion stats and visual dashboards.

- **Instructors**
  - Create and manage courses composed of structured tickets.
  - Monitor student activity and completion metrics from instructor views.
  - Use a modern, component-driven UI for day-to-day operations.

- **Companies**
  - Define the kinds of tickets and work scenarios that reflect real roles.
  - Verify completed work as proof of skills, not just certificates.

- **Platform & UI**
  - Fully responsive design optimized for desktop, tablet, and mobile.
  - Rich landing page with motion, testimonials, and persona-driven storytelling.
  - Reusable component library built on Radix UI primitives and Tailwind.
  - Toasts, dialogs, carousels, navigation menus, drawers, sheets, and more.

---

## Tech Stack

- **Frontend framework**: React 19
- **Bundler / Dev server**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, custom utility components
- **UI primitives**: Radix UI-based components
- **Routing**: `wouter`
- **State / Data fetching**: `@tanstack/react-query`
- **Animation & motion**: `framer-motion`
- **Validation & forms**: `react-hook-form` + `zod`
- **Icons**: `lucide-react`, `react-icons`

---

## Getting Started

### Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **Package manager**: npm (or pnpm/yarn if you prefer; examples use `npm`)

### Installation

From the project root:

```bash
npm install
```

This will install all dependencies specified in `package.json`.

### Local Development

Run the Vite dev server:

```bash
npm run dev
```

The app will start on a local port (typically `http://localhost:5173/`), with hot module reloading enabled.

### Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run serve
```

---

## Project Structure (high level)

```text
src/
  components/
    layout/        # Shared layouts (admin, instructor, main, etc.)
    ui/            # Reusable UI primitives built on Radix + Tailwind
  hooks/           # Reusable hooks (e.g. toast, mobile detection)
  pages/           # Route-level pages (landing, login, dashboards, tickets, etc.)
  lib/             # Frontend data utilities and helpers
  main.tsx         # Application entry point
index.html         # Root HTML template
package.json       # Scripts and dependencies
```

---

## Available Scripts

- **`npm run dev`**: Start the local development server with hot reloading.
- **`npm run build`**: Build the app for production.
- **`npm run serve`**: Preview the production build locally.
- **`npm run typecheck`**: Run TypeScript type checking using `tsc`.

---

## Development Notes

- The UI is built with a **mobile-first**, responsive mindset. All new pages and components should be tested on a range of viewport sizes.
- New UI surface areas should prefer existing primitives in `src/components/ui` before introducing new patterns.
- Data-fetching and server state should go through **React Query** where appropriate to keep caching and loading states consistent.

---

## License

This project is currently intended for internal and hackathon use. Formal licensing can be added here when the distribution model is finalized.

