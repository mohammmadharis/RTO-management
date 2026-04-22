import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Create Admin User ───
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rtopatel.com' },
    update: {},
    create: {
      name: 'Patel Admin',
      email: 'admin@rtopatel.com',
      phone: '9876543210',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user created: ${admin.email}`);

  // ─── Create Staff User ───
  const staffPasswordHash = await bcrypt.hash('staff123', 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@rtopatel.com' },
    update: {},
    create: {
      name: 'Patel Staff',
      email: 'staff@rtopatel.com',
      phone: '9876543211',
      passwordHash: staffPasswordHash,
      role: UserRole.STAFF,
      isActive: true,
    },
  });
  console.log(`  ✓ Staff user created: ${staff.email}`);

  // ─── Create Default Services ───
  const services = [
    {
      name: 'Vehicle Insurance',
      description: 'Third-party and comprehensive vehicle insurance',
      defaultFee: 500000, // ₹5,000
      hasExpiry: true,
      defaultValidityDays: 365,
    },
    {
      name: 'Green Tax',
      description: 'Green tax / road tax payment for vehicles',
      defaultFee: 300000, // ₹3,000
      hasExpiry: true,
      defaultValidityDays: 365,
    },
    {
      name: 'Fitness Certificate',
      description: 'Vehicle fitness certificate renewal',
      defaultFee: 200000, // ₹2,000
      hasExpiry: true,
      defaultValidityDays: 730, // 2 years
    },
    {
      name: 'RC Transfer',
      description: 'Registration certificate ownership transfer',
      defaultFee: 400000, // ₹4,000
      hasExpiry: false,
      defaultValidityDays: null,
    },
    {
      name: 'NOC',
      description: 'No Objection Certificate for vehicle transfer between states',
      defaultFee: 250000, // ₹2,500
      hasExpiry: false,
      defaultValidityDays: null,
    },
    {
      name: 'Hypothecation Removal',
      description: 'Remove bank hypothecation / lien from RC',
      defaultFee: 150000, // ₹1,500
      hasExpiry: false,
      defaultValidityDays: null,
    },
    {
      name: 'Driving Licence',
      description: 'New driving licence or renewal',
      defaultFee: 350000, // ₹3,500
      hasExpiry: true,
      defaultValidityDays: 1825, // 5 years
    },
    {
      name: 'Permit',
      description: 'National / State permit for commercial vehicles',
      defaultFee: 800000, // ₹8,000
      hasExpiry: true,
      defaultValidityDays: 365,
    },
  ];

  for (const svc of services) {
    const created = await prisma.service.upsert({
      where: { name: svc.name },
      update: {},
      create: svc,
    });
    console.log(`  ✓ Service: ${created.name}`);
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin → admin@rtopatel.com / admin123');
  console.log('  Staff → staff@rtopatel.com / staff123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
