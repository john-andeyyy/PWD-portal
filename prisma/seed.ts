import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {
      permissions: [
        "members.create",
        "members.view",
        "members.update",
        "members.delete",
        "accounts.manage",
      ],
    },
    create: {
      name: "admin",
      permissions: [
        "members.create",
        "members.view",
        "members.update",
        "members.delete",
        "accounts.manage",
      ],
    },
  });

  const president = await prisma.president.upsert({
    where: { email: "president@pwd.org" },
    update: {
      name: "PWD President",
      password,
      roleId: adminRole.id,
    },
    create: {
      email: "president@pwd.org",
      name: "PWD President",
      password,
      roleId: adminRole.id,
    },
  });

  const member = await prisma.member.upsert({
    where: { pwdId: "PWD-0001" },
    update: {
      fname: "PWD",
      lname: "President",
      mname: null,
      bday: new Date("1990-01-01"),
      disability: "HEARING",
      phoneNumber: "09000000000",
      address: "PWD Office",
      barangay: "POBLACION",
      isBedridden: false,
      dateIssued: new Date("2024-01-01"),
      gender: "Male",
      addedById: president.id,
    },
    create: {
      addedById: president.id,
      fname: "PWD",
      lname: "President",
      mname: null,
      bday: new Date("1990-01-01"),
      disability: "HEARING",
      phoneNumber: "09000000000",
      address: "PWD Office",
      barangay: "POBLACION",
      isBedridden: false,
      pwdId: "PWD-0001",
      dateIssued: new Date("2024-01-01"),
      gender: "Male",
    },
  });

  await prisma.president.update({
    where: { id: president.id },
    data: { memberId: member.id },
  });

  console.log("President ready:", president.email, "ID:", president.id);
  console.log("Member linked:", member.pwdId, "ID:", member.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
