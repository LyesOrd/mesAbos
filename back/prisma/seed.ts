import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Création de l'utilisateur de test
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: 'hashedpassword123',
      name: 'Test User',
      provider: 'LOCAL',
    },
  });

  console.log(`👤 Created user: ${user.email}`);

  // Création d’une catégorie
  const category = await prisma.category.create({
    data: {
      name: 'Streaming',
    },
  });

  console.log(`📂 Created category: ${category.name}`);

  // Ajout d'un abonnement Netflix
  const subscription = await prisma.subscription.create({
    data: {
      name: 'Netflix',
      amount: 12.99,
      frequency: 'MONTHLY',
      startDate: new Date(),
      userId: user.id,
      categoryId: category.id,
    },
  });

  console.log(`📅 Created subscription: ${subscription.name}`);

  // Ajout d'un paiement lié à l'abonnement
  const payment = await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      userId: user.id,
      amount: subscription.amount,
      paymentDate: new Date(),
      status: 'PAID',
    },
  });

  console.log(`💳 Created payment: ${payment.amount}€`);

  // Ajout d'un compte bancaire fictif
  const bankAccount = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      provider: 'Plaid',
      externalId: 'fake_bank_123',
      balance: 500.0,
    },
  });

  console.log(`🏦 Created bank account: ${bankAccount.provider}`);

  // Ajout d'une transaction
  await prisma.transaction.create({
    data: {
      userId: user.id,
      bankAccountId: bankAccount.id,
      description: 'Netflix Payment',
      amount: -12.99,
      date: new Date(),
      categoryId: category.id,
    },
  });

  console.log(`💰 Created transaction: Netflix -12.99€`);

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
