import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const salt = randomBytes(8).toString('hex');
  const hash = scryptSync('password1234', salt, 32).toString('hex');

  const user = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      password: `${salt}:${hash}`,
      name: 'Test User 2',
      provider: 'LOCAL',
    },
  });

  console.log(`👤 User ready: ${user.email}`);

  const categories = ['Streaming', 'Jeux vidéos', 'Livraisons', 'Musique', 'Sport', 'Hobbies'];
  const catRecords: Record<string, any> = {};
  for (const name of categories) {
    catRecords[name] = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`📂 Category ready: ${name}`);
  }

  const samples = [
    { name: 'Netflix', amount: 12.99, category: 'Streaming' },
    { name: 'Xbox Game Pass', amount: 9.99, category: 'Jeux vidéos' },
    { name: 'Amazon Prime', amount: 5.99, category: 'Livraisons' },
    { name: 'Spotify', amount: 9.99, category: 'Musique' },
    { name: 'Gym Membership', amount: 29.99, category: 'Sport' },
    { name: 'Photography Club', amount: 15.0, category: 'Hobbies' },
  ];

  for (const s of samples) {
    let sub = await prisma.subscription.findFirst({
      where: { name: s.name, userId: user.id },
    });
    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          name: s.name,
          amount: s.amount,
          frequency: 'MONTHLY',
          startDate: new Date(),
          userId: user.id,
          categoryId: catRecords[s.category].id,
        },
      });
      await prisma.payment.create({
        data: {
          subscriptionId: sub.id,
          userId: user.id,
          amount: s.amount,
          paymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
        },
      });
    }
    console.log(`📅 Subscription ready: ${s.name}`);
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

