import "dotenv/config";
import prisma from "../lib/prisma";

async function testDatabase() {
  try {
    await prisma.$connect();

    const result = await prisma.$queryRaw`
      SELECT NOW() AS current_time
    `;

    console.log("Database Connected Successfully!");
    console.log(result);
  } catch (error) {
    console.error("Database Connection Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();