import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { PrismaClient } from "@/app/generated/prisma/client"

function makeClient() {
  const adapter = new PrismaNeonHttp(process.env.POSTGRES_PRISMA_URL!, {})
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const db = globalForPrisma.prisma ?? makeClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
