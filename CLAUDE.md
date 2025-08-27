# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
커밋 메시지 작성할때 claude 계정은 포함하지 않음.
주석 및 로그는 한글로 작성함.

## Development Commands

```bash
# Development server with Turbopack (hot reload)
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

## Project Architecture

This is a Next.js 15.5.2 application using:

- **App Router** - Components live in `/app` directory
- **TypeScript** with strict mode enabled
- **Tailwind CSS v4** with PostCSS configuration
- **Turbopack** for faster builds and development
- **React 19.1.0** with latest features

### Key Paths

- `/app` - App Router pages and layouts
- `/public` - Static assets served directly
- Path alias: `@/*` maps to project root (e.g., `@/app/page.tsx`)

### Main Entry Points

- `app/layout.tsx` - Root layout with Geist font setup
- `app/page.tsx` - Home page component
- `app/globals.css` - Global styles with Tailwind directives

## Important Configuration

- **Turbopack** is enabled for both dev and build commands for faster compilation
- **ESLint** uses Next.js Core Web Vitals rules with TypeScript support
- **TypeScript** configured with `strict: true` and module resolution set to `bundler`
