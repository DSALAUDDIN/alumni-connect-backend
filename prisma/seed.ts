import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'nicalumni.official@gmail.com';
    // Change this password after the first login!
    const passwordHash = await bcrypt.hash('Admin@1234', 12);

    console.log(`Ensuring Super Admin exists with email: ${email}`);

    const superAdmin = await prisma.user.upsert({
        where: { email },
        update: {
            role: UserRole.SUPER_ADMIN,
            status: AccountStatus.ACTIVE,
            isVerified: true,
            isEmailVerified: true,
        },
        create: {
            email,
            passwordHash,
            firstName: 'System',
            lastName: 'Super Admin',
            role: UserRole.SUPER_ADMIN,
            status: AccountStatus.ACTIVE,
            isVerified: true,
            isEmailVerified: true,
        },
    });

    console.log('Super Admin successfully seeded/promoted:', superAdmin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
