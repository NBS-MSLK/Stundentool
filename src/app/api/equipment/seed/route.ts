import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'No ADMIN user found, please create one first.' }, { status: 400 });
    }

    // Check if we already have the categories to avoid duplication
    const existing = await prisma.equipmentCategory.findFirst({
      where: { title: '1. Maschinen' }
    });

    if (existing) {
      return NextResponse.json({ message: 'Daten scheinen schon vorhanden zu sein. Abbruch, um Duplikate zu vermeiden.' });
    }

    // Categories
    const catMaschinen = await prisma.equipmentCategory.create({ data: { title: '1. Maschinen', creatorId: adminUser.id } });
    const catSiebdruck = await prisma.equipmentCategory.create({ data: { title: '2. Siebdruck-Set', creatorId: adminUser.id } });
    const catHolz = await prisma.equipmentCategory.create({ data: { title: '3. Einrichtung Holzwerkstatt', creatorId: adminUser.id } });
    const catMoebel = await prisma.equipmentCategory.create({ data: { title: '4. Möbel', creatorId: adminUser.id } });

    // 1. Maschinen
    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMaschinen.id,
        title: 'Shaper Origin + Workstation + Plate',
        description: 'Handgeführte CNC-Maschine. Mobil einsetzbar.',
        price: 4569.60,
        buyLink: 'https://www.shapertools.com/de-de/',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED',
        materials: {
          create: [
            { name: 'SHAPER Tape (10x)', quantity: 1, pricePerUnit: 226.10, buyLink: '' },
            { name: 'Spannzangen-Set', quantity: 1, pricePerUnit: 208.25, buyLink: '' },
            { name: 'Basis Fräser-Sets (5x)', quantity: 1, pricePerUnit: 565.25, buyLink: '' },
            { name: 'Shaper Trace', quantity: 1, pricePerUnit: 117.81, buyLink: '' },
            { name: 'Software: Shaper Studio', quantity: 1, pricePerUnit: 350.00, buyLink: '' }
          ]
        }
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMaschinen.id,
        title: '3D-Drucker: Bambu Lab X1 Carbon + AMS (3x)',
        description: 'Eingehauster Core-XY-3D-Drucker mit Multimaterial/-color-System.',
        price: 4197.00,
        buyLink: 'https://eu.store.bambulab.com/de/products/x1-carbon',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED',
        materials: {
          create: [
            { name: 'Druckplatten (3x)', quantity: 1, pricePerUnit: 103.17, buyLink: '' },
            { name: 'Filament (50kg)', quantity: 1, pricePerUnit: 849.50, buyLink: '' },
            { name: 'AMS-Hub', quantity: 1, pricePerUnit: 54.99, buyLink: '' },
            { name: 'Filament Trockner', quantity: 1, pricePerUnit: 65.00, buyLink: '' },
            { name: 'Hotends mit Düse (3x)', quantity: 1, pricePerUnit: 248.97, buyLink: '' }
          ]
        }
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMaschinen.id,
        title: 'große CNC-Maschine: Inventables X-Carve',
        description: 'Einsteigerfreundliche Portalfräse für Holz, Alu und Kunststoffe.',
        price: 3299.00,
        buyLink: 'https://www.mybotshop.de/Inventables-X-Carve-CNC-Milling-Machine',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED',
        materials: {
          create: [
            { name: 'Bitset für Holz, etc. (3x)', quantity: 1, pricePerUnit: 194.85, buyLink: '' },
            { name: 'Gravierbits-Set (3x)', quantity: 1, pricePerUnit: 209.85, buyLink: '' },
            { name: 'Kegelfräser 1/4 (3x)', quantity: 1, pricePerUnit: 122.85, buyLink: '' },
            { name: 'Kegelfräser 1/8 (3x)', quantity: 1, pricePerUnit: 152.85, buyLink: '' }
          ]
        }
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMaschinen.id,
        title: 'Lasercutter: xTool P2 55W',
        description: 'Zum Schneiden von Acryl, Pappe und Holz.',
        price: 5979.00,
        buyLink: 'https://de.xtool.com/products/xtool-p2-55w-co2-laser-cutter',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMaschinen.id,
        title: 'SLS-3D-Drucker: Anycubic Photon Mono M5s Pro',
        description: 'SLS-Drucker auf Basis von Kunstharz.',
        price: 1009.00,
        buyLink: 'https://de.anycubic.com/',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED',
        materials: {
          create: [
            { name: 'Resin (20x)', quantity: 1, pricePerUnit: 431.80, buyLink: '' }
          ]
        }
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMaschinen.id,
        title: 'kleine CNC-Maschine: Makera Carvera',
        description: 'Vielseitige CNC-Maschine für Leiterplatten (PCBs) und mehr.',
        price: 5632.81,
        buyLink: 'https://www.makera.com/products/carvera',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMaschinen.id,
        title: 'Schneidplotter: Mimaki CG-130 AR',
        description: 'Professioneller Schneidplotter.',
        price: 3290.00,
        buyLink: 'https://www.msl-shop.de/',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED',
        materials: {
          create: [
            { name: 'Material', quantity: 1, pricePerUnit: 200.00, buyLink: '' }
          ]
        }
      }
    });

    // 2. Siebdruck-Set
    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catSiebdruck.id,
        title: 'Siebdruck-Set 4-farbig',
        description: 'Für T-Shirt-Druck und Papier.',
        price: 499.00,
        buyLink: 'https://www.siebdruck-versand.de/',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catSiebdruck.id,
        title: 'Transferpresse: Secabo TC7 SMART',
        description: 'Zum Einbacken von Siebdruck.',
        price: 1385.99,
        buyLink: 'https://www.siebdruck-versand.de/',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    // 3. Einrichtung Holzwerkstatt
    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Kappsäge (Einhell TC-SM 2131/1 Dual)',
        description: 'Zug-Kapp-Gehrungssäge',
        price: 115.94,
        buyLink: 'https://www.manomano.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Bandsäge (Scheppach HBS30)',
        description: '',
        price: 129.00,
        buyLink: 'https://www.amazon.de/',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Dickenhobel (Metabo DH 330)',
        description: '',
        price: 410.00,
        buyLink: 'https://www.hornbach.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Standbohrmaschine (Einhell)',
        description: '',
        price: 126.13,
        buyLink: 'https://www.amazon.de/',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Tischkreissäge (Festool TKS 80 EBS ST 840-Set)',
        description: 'Mit Saw-Stop!',
        price: 3973.95,
        buyLink: 'https://www.bauportal24h.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Band- und Tellerschleifer (Scheppach BTS900)',
        description: '',
        price: 119.00,
        buyLink: 'https://www.manomano.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Stichsäge (Metabo STE 100)',
        description: '',
        price: 120.50,
        buyLink: 'https://www.manomano.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Handkreissäge (Bosch Professional GKS 190)',
        description: '',
        price: 129.00,
        buyLink: 'https://www.bauhaus.info',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Akkuschrauber (Bosch GSR 18V-55 Pro)',
        description: '',
        price: 268.99,
        buyLink: 'https://www.manomano.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Schlagbohrmaschine (Einhell RT-ID 65)',
        description: '',
        price: 49.95,
        buyLink: 'https://www.voelkner.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PURCHASED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Elektrohobel (Bosch PHO 2000)',
        description: '',
        price: 95.85,
        buyLink: 'https://www.hornbach.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catHolz.id,
        title: 'Drechselbank (Holzmann D 460FXL)',
        description: '',
        price: 324.89,
        buyLink: 'https://www.voelkner.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    // 4. Möbel
    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMoebel.id,
        title: 'Tische (6x) FlexMax',
        description: '',
        price: 1331.70,
        buyLink: 'https://www.betzold.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMoebel.id,
        title: 'Stühle (10x) Work',
        description: '',
        price: 1319.50,
        buyLink: 'https://www.betzold.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMoebel.id,
        title: 'Laptop-Locker Orgami Energy',
        description: '',
        price: 1196.00,
        buyLink: 'https://www.backwinkel.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMoebel.id,
        title: 'Gefahrenstoffschrank (Asecos)',
        description: '',
        price: 537.00,
        buyLink: 'https://www.denios.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMoebel.id,
        title: 'Werkbank Nordic Plus',
        description: '',
        price: 440.00,
        buyLink: 'https://www.toom.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    await prisma.equipmentSuggestion.create({
      data: {
        categoryId: catMoebel.id,
        title: 'Schließfachschrank Ole',
        description: '',
        price: 521.50,
        buyLink: 'https://www.inwerk-bueromoebel.de',
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        status: 'PROPOSED'
      }
    });

    // Setup budget if it does not exist
    const currentBudget = await prisma.equipmentBudget.findUnique({ where: { id: 'singleton' } });
    if (!currentBudget) {
      await prisma.equipmentBudget.create({
        data: { totalAmount: 60886.46 }
      });
    }

    return NextResponse.json({ message: 'Datenbank erfolgreich gefüllt!' });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
