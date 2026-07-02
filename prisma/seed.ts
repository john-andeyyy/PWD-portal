import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);
  const president = await prisma.president.upsert({
    where: { email: "president@pwd.org" },
    update: { name: "PWD President", password },
    create: {
      email: "president@pwd.org",
      name: "PWD President",
      password,
    },
  });

  console.log("President ready:", president.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
