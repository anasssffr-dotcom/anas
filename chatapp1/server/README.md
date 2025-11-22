Server scaffold added.

Usage locally:
1. cd server
2. npm install
3. export DATABASE_URL="postgresql://user:pass@host:port/dbname"
4. npm run dev

Migrations:
- drizzle-kit migrate:latest --config drizzle.config.ts
