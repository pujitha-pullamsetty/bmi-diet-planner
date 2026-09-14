const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const count = await prisma.userPreference.count();

    console.log("User preferences:", count);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();