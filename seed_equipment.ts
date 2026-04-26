import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Equipment Data...');

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.log('No ADMIN user found, please create one first.');
    return;
  }

  // Categories
  const cat3D = await prisma.equipmentCategory.create({ data: { title: '3D-Drucker' } });
  const catCNC = await prisma.equipmentCategory.create({ data: { title: 'CNC-Fräsen' } });
  const catLaser = await prisma.equipmentCategory.create({ data: { title: 'Lasercutter' } });
  const catHolz = await prisma.equipmentCategory.create({ data: { title: 'Holzwerkstatt' } });
  const catMoebel = await prisma.equipmentCategory.create({ data: { title: 'Möbel' } });

  // 1. 3D Drucker: Bambu Lab X1 Carbon
  await prisma.equipmentSuggestion.create({
    data: {
      categoryId: cat3D.id,
      title: 'Bambu Lab X1 Carbon + AMS (3x)',
      description: 'Eingehauster Core-XY-3D-Drucker mit Multimaterial/-color-System. Drei Geräte für eine optimale Ausstattung.',
      price: 4197.00,
      buyLink: 'eu.store.bambulab.com/de/products/x1-carbon',
      creatorId: adminUser.id,
      creatorName: adminUser.name,
      status: 'APPROVED',
      materials: {
        create: [
          { name: 'Druckplatten', quantity: 3, pricePerUnit: 34.39, buyLink: '' },
          { name: 'Filament (50 kg)', quantity: 50, pricePerUnit: 16.99, buyLink: '' },
          { name: 'AMS-Hub', quantity: 1, pricePerUnit: 54.99, buyLink: '' },
          { name: 'Filament-Trockner', quantity: 1, pricePerUnit: 65.00, buyLink: '' },
          { name: 'Hotends mit Düse', quantity: 3, pricePerUnit: 82.99, buyLink: '' }
        ]
      }
    }
  });

  // 2. CNC Fräse: Shaper Origin
  await prisma.equipmentSuggestion.create({
    data: {
      categoryId: catCNC.id,
      title: 'Shaper Origin + Workstation + Plate',
      description: 'Handgeführte CNC-Maschine. Mobil einsetzbar.',
      price: 4569.60,
      buyLink: 'shapertools.com',
      creatorId: adminUser.id,
      creatorName: adminUser.name,
      status: 'APPROVED',
      materials: {
        create: [
          { name: 'Shaper Tapes (10x)', quantity: 10, pricePerUnit: 22.61, buyLink: '' },
          { name: 'Spannzangen-Set', quantity: 1, pricePerUnit: 208.25, buyLink: '' },
          { name: 'Basis Fräser-Sets', quantity: 5, pricePerUnit: 113.05, buyLink: '' },
          { name: 'Shaper Trace-Rahmen', quantity: 1, pricePerUnit: 117.81, buyLink: '' },
          { name: 'Shaper Studio-Software', quantity: 1, pricePerUnit: 350.00, buyLink: '' }
        ]
      }
    }
  });

  // 3. CNC Fräse: Inventables X-Carve
  await prisma.equipmentSuggestion.create({
    data: {
      categoryId: catCNC.id,
      title: 'Inventables X-Carve',
      description: 'Einsteigerfreundliche Portalfräse für Holz, Alu und Kunststoffe.',
      price: 3299.00,
      buyLink: '',
      creatorId: adminUser.id,
      creatorName: adminUser.name,
      status: 'PROPOSED',
      materials: {
        create: [
          { name: 'Bitset für Holz', quantity: 3, pricePerUnit: 64.95, buyLink: '' },
          { name: 'Gravierbits-Set', quantity: 3, pricePerUnit: 69.95, buyLink: '' }
        ]
      }
    }
  });

  // 4. Lasercutter: xTool P2 55W
  await prisma.equipmentSuggestion.create({
    data: {
      categoryId: catLaser.id,
      title: 'xTool P2 55W',
      description: 'Zum Schneiden von Acryl, Pappe und Holz. 55W CO2-Laser.',
      price: 5979.00,
      buyLink: 'xtool.com',
      creatorId: adminUser.id,
      creatorName: adminUser.name,
      status: 'PROPOSED'
    }
  });

  // 5. Holzwerkstatt (Already Purchased)
  await prisma.equipmentSuggestion.create({
    data: {
      categoryId: catHolz.id,
      title: 'Bohrmaschine (Einhell)',
      description: 'Schon angeschafft.',
      price: 49.95,
      buyLink: '',
      creatorId: adminUser.id,
      creatorName: adminUser.name,
      status: 'PURCHASED'
    }
  });

  await prisma.equipmentSuggestion.create({
    data: {
      categoryId: catHolz.id,
      title: 'Kappsäge (Einhell)',
      description: 'Zug-Kapp-Gehrungssäge',
      price: 115.94,
      buyLink: '',
      creatorId: adminUser.id,
      creatorName: adminUser.name,
      status: 'PROPOSED'
    }
  });

  // Create initial budget
  await prisma.equipmentBudget.create({
    data: { totalAmount: 25000.00 }
  });

  console.log('Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
