import { PrismaClient } from "../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const prismaClientSingleton = () => {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

declare global {
  var prisma: undefined | PrismaClientSingleton;
}

const hasCurrentDelegates = (
  client: PrismaClientSingleton | undefined
): client is PrismaClientSingleton =>
  Boolean(client?.campaign);

const prisma: PrismaClientSingleton = hasCurrentDelegates(globalThis.prisma)
  ? globalThis.prisma
  : prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
