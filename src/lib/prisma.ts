import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Prisma 7 requires an explicit driver adapter (no more `url` in the
// datasource block). DATABASE_URL uses the Prisma-style "file:./dev.db"
// form; better-sqlite3 wants a plain filesystem path.
function sqliteFilePath(databaseUrl: string): string {
  return databaseUrl.startsWith('file:') ? databaseUrl.slice('file:'.length) : databaseUrl;
}

const adapter = new PrismaBetterSqlite3({
  url: sqliteFilePath(process.env.DATABASE_URL ?? 'file:./dev.db'),
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
