/**
 * Prisma client singleton.
 * Run `npx prisma generate` once after cloning to generate the client types.
 * The @prisma/client import will work correctly after generation.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

type PrismaClientType = InstanceType<typeof PrismaClient>

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientType | undefined
}

export const prisma: PrismaClientType =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
