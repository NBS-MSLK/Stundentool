import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Credentials must never be included implicitly, including nested user relations.
  return new PrismaClient({ omit: { user: { password: true } } })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
