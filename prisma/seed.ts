/**
 * Database Seed Script
 * Run with: npx prisma db seed
 * 
 * This creates:
 * - An admin user
 * - Sample predictions
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hash('830943033', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'mugweadams439@gmail.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'mugweadams439@gmail.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create sample predictions
  const predictions = [
    {
      matchName: 'Arsenal vs Liverpool',
      homeTeam: 'Arsenal',
      awayTeam: 'Liverpool',
      league: 'English Premier League',
      kickOff: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      tip: 'Both Teams to Score',
      odds: 1.65,
      isPremium: false,
      analysis: 'Both teams have been scoring consistently in their last 5 matches.',
    },
    {
      matchName: 'Barcelona vs Real Madrid',
      homeTeam: 'Barcelona',
      awayTeam: 'Real Madrid',
      league: 'La Liga',
      kickOff: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      tip: 'Over 2.5 Goals',
      odds: 1.75,
      isPremium: true,
      analysis: 'El Clasico always delivers goals. Both teams have strong attacks.',
    },
    {
      matchName: 'Bayern Munich vs Dortmund',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Dortmund',
      league: 'Bundesliga',
      kickOff: new Date(Date.now() + 72 * 60 * 60 * 1000),
      tip: 'Home Win & Over 1.5',
      odds: 1.90,
      isPremium: true,
      analysis: 'Bayern is dominant at home with 80% win rate this season.',
    },
    {
      matchName: 'Man City vs Chelsea',
      homeTeam: 'Manchester City',
      awayTeam: 'Chelsea',
      league: 'English Premier League',
      kickOff: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      tip: 'Home Win',
      odds: 1.45,
      isPremium: false,
      status: 'WON',
      analysis: 'City dominated as expected.',
    },
    {
      matchName: 'PSG vs Marseille',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      league: 'Ligue 1',
      kickOff: new Date(Date.now() - 48 * 60 * 60 * 1000),
      tip: 'Both Teams to Score',
      odds: 1.85,
      isPremium: true,
      status: 'WON',
      analysis: 'Le Classique delivered as expected.',
    },
    {
      matchName: 'Juventus vs AC Milan',
      homeTeam: 'Juventus',
      awayTeam: 'AC Milan',
      league: 'Serie A',
      kickOff: new Date(Date.now() - 72 * 60 * 60 * 1000),
      tip: 'Over 2.5 Goals',
      odds: 2.00,
      isPremium: false,
      status: 'LOST',
      analysis: 'Defensive masterclass from both teams.',
    },
  ];

  for (const pred of predictions) {
    await prisma.prediction.create({
      data: pred as any,
    });
  }
  console.log(`✅ Created ${predictions.length} sample predictions`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
