import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const salt = randomBytes(8).toString('hex');
  const hash = scryptSync('password1234', salt, 32).toString('hex');

  // Création de l'utilisateur de test (upsert pour garder l'utilisateur ou le créer)
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

  console.log(`👤 Created user: ${user.email}`);

  // Nom de la catégorie et de l'abonnement à gérer
  const categoryName = 'Streaming';
  const subscriptionName = 'Netflix';

  // Si la catégorie existe, supprimer les enregistrements liés puis la recréer
  const existingCategory = await prisma.category.findUnique({
    where: { name: categoryName },
  });
  if (existingCategory) {
    // Supprimer les transactions liées à cette catégorie
    await prisma.transaction.deleteMany({
      where: { categoryId: existingCategory.id },
    });

    // Récupérer les abonnements liés à cette catégorie pour supprimer leurs paiements
    const subs = await prisma.subscription.findMany({
      where: { categoryId: existingCategory.id },
    });
    for (const sub of subs) {
      await prisma.payment.deleteMany({ where: { subscriptionId: sub.id } });
    }

    // Supprimer les abonnements liés
    await prisma.subscription.deleteMany({
      where: { categoryId: existingCategory.id },
    });

    // Supprimer la catégorie
    await prisma.category.delete({ where: { id: existingCategory.id } });

    console.log(
      `🗑️ Deleted existing category and related records: ${categoryName}`,
    );
  }

  // Recréer la catégorie
  const category = await prisma.category.create({
    data: {
      name: categoryName,
    },
  });

  console.log(`📂 Created category: ${category.name}`);

  // Si un abonnement du même nom et utilisateur existe, le supprimer avec ses paiements
  const existingSubscription = await prisma.subscription.findFirst({
    where: { name: subscriptionName, userId: user.id },
  });

  if (existingSubscription) {
    await prisma.payment.deleteMany({
      where: { subscriptionId: existingSubscription.id },
    });
    await prisma.subscription.delete({
      where: { id: existingSubscription.id },
    });
    console.log(
      `🗑️ Deleted existing subscription and related payments: ${subscriptionName}`,
    );
  }

  // Ajout d'un abonnement Netflix
  const subscription = await prisma.subscription.create({
    data: {
      name: subscriptionName,
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
      externalId: 'Boursorama',
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
