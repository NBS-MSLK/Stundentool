import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'No ADMIN user found, please create one first.' }, { status: 400 });
    }

    // Falls das alte, falsche Seed-Skript verwendet wurde, räumen wir diese 4 Kategorien kurz auf
    const badCat = await prisma.equipmentCategory.findFirst({ where: { title: '1. Maschinen' } });
    if (badCat) {
      await prisma.equipmentCategory.deleteMany({
         where: { title: { in: ['1. Maschinen', '2. Siebdruck-Set', '3. Einrichtung Holzwerkstatt', '4. Möbel'] } }
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    if (force) {
      // Wenn ?force=true übergeben wird, löschen wir alle bisherigen Equipment-Daten
      await prisma.equipmentSuggestion.deleteMany();
      await prisma.equipmentCategory.deleteMany();
    } else {
      // Check if we already have the correct categories to avoid duplication
      const existing = await prisma.equipmentCategory.findFirst({
        where: { title: '1. Handgeführte CNC' }
      });

      if (existing) {
        return NextResponse.json({ message: 'Daten scheinen schon vorhanden zu sein. Hänge ?force=true an die URL an, um alle alten Daten zu überschreiben.' });
      }
    }

    // Helper to create category and initial suggestion
    async function addEquipment(
      catName: string, 
      title: string, 
      price: number, 
      buyLink: string, 
      description: string, 
      materials: {name: string, quantity: number, price: number, link: string}[] = []
    ) {
      const category = await prisma.equipmentCategory.create({ data: { title: catName, creatorId: adminUser!.id } });
      await prisma.equipmentSuggestion.create({
        data: {
          categoryId: category.id,
          title: title,
          description: description,
          price: price,
          buyLink: buyLink,
          creatorId: adminUser!.id,
          creatorName: adminUser!.name,
          status: 'PROPOSED',
          materials: {
            create: materials.map(m => ({
              name: m.name,
              quantity: m.quantity,
              pricePerUnit: m.price,
              buyLink: m.link
            }))
          }
        }
      });
    }

    // 1-8
    await addEquipment('1. Handgeführte CNC', 'Shaper Origin + Workstation + Plate', 4569.60, 'https://www.shapertools.com/de-de/', 'Handgeführte CNC-Maschine.', [
      { name: 'SHAPER Tape (10x)', quantity: 1, price: 226.10, link: 'https://www.shapertools.com/de-de/shapertape' },
      { name: 'Spannzangen-Set', quantity: 1, price: 208.25, link: 'https://www.shapertools.com/de-de/collet-kit' },
      { name: 'Basis Fräser-Sets (5x)', quantity: 1, price: 565.25, link: 'https://www.shapertools.com/de-de/cutters' },
      { name: 'Shaper Trace', quantity: 1, price: 117.81, link: 'https://www.shapertools.com/de-de/trace' },
      { name: 'Software: Shaper Studio', quantity: 1, price: 350.00, link: 'https://www.shapertools.com/de-de/studio' }
    ]);
    await addEquipment('2. 3D-Drucker', '3x Bambu Lab X1 Carbon + AMS', 4197.00, 'https://eu.store.bambulab.com/de/products/x1-carbon', 'Core-XY-3D-Drucker.', [
      { name: 'Druckplatten (3x)', quantity: 1, price: 103.17, link: 'https://eu.store.bambulab.com/de/products/bambu-textured-pei-plate' },
      { name: 'Filament (50kg)', quantity: 1, price: 849.50, link: 'https://eu.store.bambulab.com/de/collections/bambu-pla' },
      { name: 'AMS-Hub', quantity: 1, price: 54.99, link: 'https://eu.store.bambulab.com/de/products/bambu-ams-hub' },
      { name: 'Filament Trockner', quantity: 1, price: 65.00, link: 'https://www.3djake.de/sunlu/filadryer-s2?sai=12286' },
      { name: 'Hotends mit Düse (3x)', quantity: 1, price: 248.97, link: 'https://eu.store.bambulab.com/de/products/all-in-one-hotends-bundle' }
    ]);
    await addEquipment('3. Große CNC-Maschine', 'Inventables X-Carve', 3299.00, 'https://www.mybotshop.de/Inventables-X-Carve-CNC-Milling-Machine', 'Portalfräse.', [
      { name: 'Bitset Holz/Alu', quantity: 1, price: 194.85, link: 'https://www.reichelt.de/cnc-x-carve-bitset-fuer-holz-kunststoff-aluminium-inv-mbs-in-03-p286987.html' },
      { name: 'Gravierbits-Set', quantity: 1, price: 209.85, link: 'https://www.reichelt.de/cnc-x-carve-bitset-fuer-gravierungen-inv-mbs-in-04-p286988.html' },
      { name: 'Kegelfräser 1/4', quantity: 1, price: 122.85, link: '' },
      { name: 'Kegelfräser 1/8', quantity: 1, price: 152.85, link: '' }
    ]);
    await addEquipment('4. Lasercutter', 'xTool P2 55W', 5979.00, 'https://de.xtool.com/products/xtool-p2-55w-co2-laser-cutter', 'CO2 Laser Cutter.', []);
    await addEquipment('5. Resin 3D-Drucker', 'Anycubic Photon Mono M5s Pro', 1009.00, 'https://de.anycubic.com/', 'Resin 3D-Drucker.', [
      { name: 'Resin (20x)', quantity: 1, price: 431.80, link: 'https://www.amazon.de/ANYCUBIC-Photopolymer-Genauigkeit-Hervorragender-Flie%C3%9Ff%C3%A4higkeit/dp/B07K8GBT9W/' }
    ]);
    await addEquipment('6. Kleine CNC-Maschine', 'Makera Carvera', 5632.81, 'https://www.makera.com/products/carvera', 'Desktop CNC.', []);
    await addEquipment('7. Schneidplotter', 'Mimaki CG-130 AR', 3290.00, 'https://www.msl-shop.de/mimaki-cg-ar-schneideplotterserie', 'Profi-Schneidplotter.', [{ name: 'Material', quantity: 1, price: 200.00, link: '' }]);
    await addEquipment('8. Siebdruck', 'Siebdruck-Set & Transferpresse', 0, '', 'T-Shirt-Druck.', [
      { name: 'Siebdruck-Set 4-farbig', quantity: 1, price: 499.00, link: 'https://www.siebdruck-versand.de/siebdruck-set-fuer-mehrfarbigen-siebdruck' },
      { name: 'Transferpresse Secabo TC7 SMART', quantity: 1, price: 1385.99, link: 'https://www.siebdruck-versand.de/transferpresse-fuer-transferdrucke-secabo' }
    ]);

    // 9. Holzwerkstatt - Split into individual categories
    await addEquipment('9.1 Holz: Kappsäge', 'Einhell TC-SM 2131/1 Dual', 115.94, 'https://www.manomano.de/p/einhell-zug-kapp-gehrungssaege-4300390-tc-sm-2131-2-dual', 'Zug-Kapp-Gehrungssäge.');
    await addEquipment('9.2 Holz: Bandsäge', 'Scheppach HBS30', 129.00, 'https://www.amazon.de/dp/B00J22Z1W2', 'Kompakte Bandsäge.');
    await addEquipment('9.3 Holz: Dickenhobel', 'Metabo DH 330', 410.00, 'https://www.hornbach.de/p/dickenhobel-metabo-dh-330/', 'Dickenhobel für präzises Arbeiten.');
    await addEquipment('9.4 Holz: Standbohrmaschine', 'Einhell Standbohrmaschine', 126.13, 'https://www.amazon.de/dp/B0987TDJPK', 'Für präzise Bohrungen.');
    await addEquipment('9.5 Holz: Tischkreissäge', 'Festool TKS 80 EBS ST 840-Set', 3973.95, 'https://www.bauportal24h.de/festool-tischkreissaege-tks-80', 'Profi-Tischkreissäge mit SawStop-Technologie.');
    await addEquipment('9.6 Holz: Schleifmaschine', 'Scheppach BTS900', 119.00, 'https://www.manomano.de/p/scheppach-band-und-tellerschleifer-bts900-150-mm-schleifteller-370-w-9632731', 'Band- und Tellerschleifer.');
    await addEquipment('9.7 Holz: Stichsäge', 'Metabo STE 100', 120.50, 'https://www.bachgmbh.de/Stichsaege-STE-100-Quick-Set-601100900-Metabo', 'Elektronische Stichsäge.');
    await addEquipment('9.8 Holz: Handkreissäge', 'Bosch GKS 190', 129.00, 'https://www.hornbach.de/p/handkreissaege-bosch-professional-gks-190-inkl-kreissaegeblatt-optiline-wood-190-x-30-x-2-0-mm-16-zaehne/6097608/', 'Handliche Kreissäge.');
    await addEquipment('9.9 Holz: Akkuschrauber', 'Bosch GSR 18V-55 Pro', 268.99, 'https://www.manomano.de/p/bosch-professional-bosch-akku-bohrschrauber-gsr-18v-110-c-mit-2-x-akku-procore18v-40-ah-und-l-boxx-75280802', 'Profi-Akkuschrauber.');
    await addEquipment('9.10 Holz: Schlagbohrmaschine', 'Einhell RT-ID 65', 49.95, 'https://www.voelkner.de/products/666639/Einhell-RT-ID-65-1-1-Gang-Schlagbohrmaschine-650W-inkl.-Koffer.html', 'Schlagbohrmaschine.');
    await addEquipment('9.11 Holz: Elektrohobel', 'Bosch PHO 2000', 95.85, 'https://www.hornbach.de/p/hobel-bosch-pho-2000-inkl-hobelmesser/5636689/', 'Elektrohobel.');
    await addEquipment('9.12 Holz: Drechselbank', 'Holzmann D 460FXL', 324.89, 'https://www.voelkner.de/products/201655/Holzmann-Maschinen-D460FXL230V-Holz-Drehmaschine-550-770W.html', 'Drechselbank für Holzarbeiten.');

    // 10-17
    await addEquipment('10.1 Möbel: Tische', 'Stack-o-Flex Quadrattisch (6x)', 1331.70, 'https://www.roth-schulmoebel.de', 'Höhenverstellbar und stapelbar.');
    await addEquipment('10.2 Möbel: Stühle', 'Schalenstuhl „Work“ (10x)', 1319.50, 'https://www.betzold.de', 'Höhenverstellbarer Drehstuhl mit Kunststoffsitzschale.');
    await addEquipment('10.3 Möbel: Laptop-Locker', 'Orgami Laptop-Locker Energy', 1196.00, 'https://www.backwinkel.de', 'Zum sicheren Verstauen und Laden von Laptops.');
    await addEquipment('10.4 Möbel: Gefahrenstoffschrank', 'Chemikalienschrank Easy CS 103', 537.00, 'https://www.denios.de', 'Mit Flügeltüren und Bodenwanne.');
    await addEquipment('10.5 Möbel: Werkbank', 'Werkbank „Nordic Plus 1450“', 440.00, 'https://toom.de', 'Robuste Werkbank 147 x 63 x 86 cm.');
    await addEquipment('10.6 Möbel: Schließfachschrank', 'XL Wertfachschrank 120 cm', 521.50, 'https://www.luellmann.com', 'Schließfachschrank mit 12 Fächern.');
    await addEquipment('11. Filament-Recycler', 'Original Desktop Filament Extruder MK2', 899.00, 'https://www.artme-3d.de', 'Recycler.', []);
    await addEquipment('12. Computer', 'Laptops', 0, '', 'IT-Ausstattung.', [
      { name: 'High-End-Laptop', quantity: 1, price: 2699.00, link: '' },
      { name: 'Kurs-Geräte (5x)', quantity: 1, price: 2995.00, link: '' }
    ]);
    await addEquipment('13.1 Elektrotechnik: Lötstation', 'Ersa 0ICV4005AICXV', 3104.98, 'https://www.voelkner.de/products/7774030/Ersa-0ICV4005AICXV-Loet-Entloetstation-500W-150-450C.html', 'Löt-/Entlötstation 500 W 150 - 450 °C.');
    await addEquipment('13.2 Elektrotechnik: Oszilloskop', 'Voltcraft DSO-2154', 415.00, 'https://www.conrad.de', 'Digital-Oszilloskop 150 MHz 4-Kanal.');
    await addEquipment('13.3 Elektrotechnik: Multimeter', 'Voltcraft MT-52', 114.98, 'https://www.voelkner.de/products/185743/VOLTCRAFT-MT-52-Hand-Multimeter-digital-Umwelt-Messfunktion-CAT-III-600V-Anzeige-Counts-4000.html', 'Hand-Multimeter digital.');
    await addEquipment('13.4 Elektrotechnik: Labornetzgerät', 'Voltcraft LPS1305', 134.99, 'https://www.voelkner.de/products/7571816/VOLTCRAFT-Labornetzgeraet-einstellbar-LPS1305-0.html', 'Labornetzgerät, einstellbar 0 - 30 V/DC 0 - 5 A.');
    await addEquipment('13.5 Elektrotechnik: Punktschweißgerät', 'VEVOR Akku-Punktschweißgerät 788H', 129.99, 'https://www.kaufland.de', 'Pulsschweißgerät & Akkuladegerät.');
    await addEquipment('14. Nähmaschinen', 'Brother KD 40S (5x)', 897.00, '', 'Nähmaschinen.', []);
    await addEquipment('15. Präsentationstechnik', 'Samsung QLED 85"', 1678.00, '', 'Smart TV.', []);
    await addEquipment('16.1 Vereinsleben: Kühlschrank', 'Gastro-Cool Displaykühlschrank', 571.00, 'https://gastro-cool.com', 'Kühlschrank für Getränke.');
    await addEquipment('16.2 Vereinsleben: Kaffeevollautomat', 'PHILIPS 2300 Series', 399.99, 'https://www.amazon.de', 'Kaffeevollautomat mit LatteGo-Milchsystem.');
    await addEquipment('17. Software & Abos', 'Adobe & Co', 1650.00, '', 'Abonnements.', []);

    // Setup budget if it does not exist
    const currentBudget = await prisma.equipmentBudget.findUnique({ where: { id: 'singleton' } });
    if (!currentBudget) {
      await prisma.equipmentBudget.create({
        data: { totalAmount: 60886.46 }
      });
    }

    return NextResponse.json({ message: 'Datenbank erfolgreich mit allen 17+ Kategorien gefüllt!' });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
