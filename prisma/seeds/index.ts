import { hashSync } from "bcrypt";
import { roles } from "../../src/utils/roles";
import { prisma } from "../../src/utils/client";

async function main() {
  try {
    console.log("SEEDING");
    const admin = await prisma.user.create({
      data: {
        email: "admin@gmail.com",
        firstName: "LaLa",
        lastName: "Homes Admin",
        password: hashSync("abc123", 10),
      },
    });
    await prisma.userRoles.create({
      data: { userId: admin.id, role: roles.ADMIN },
    });
    console.log("SEEDING COMPLETE");
  } catch (error) {
    console.log("SEEDING FAILED", error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
