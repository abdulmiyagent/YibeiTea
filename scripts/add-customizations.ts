import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const customizationGroups = [
  {
    type: "SUGAR_LEVEL" as const,
    sortOrder: 1,
    values: [
      { value: "0", sortOrder: 1, isDefault: false, translations: { nl: "Geen suiker", en: "No sugar" } },
      { value: "25", sortOrder: 2, isDefault: false, translations: { nl: "25% suiker", en: "25% sugar" } },
      { value: "50", sortOrder: 3, isDefault: false, translations: { nl: "50% suiker", en: "50% sugar" } },
      { value: "75", sortOrder: 4, isDefault: false, translations: { nl: "75% suiker", en: "75% sugar" } },
      { value: "100", sortOrder: 5, isDefault: true, translations: { nl: "100% suiker", en: "100% sugar" } },
    ],
  },
  {
    type: "ICE_LEVEL" as const,
    sortOrder: 2,
    values: [
      { value: "none", sortOrder: 1, isDefault: false, translations: { nl: "Geen ijs", en: "No ice" } },
      { value: "less", sortOrder: 2, isDefault: false, translations: { nl: "Weinig ijs", en: "Less ice" } },
      { value: "normal", sortOrder: 3, isDefault: true, translations: { nl: "Normaal", en: "Normal" } },
      { value: "extra", sortOrder: 4, isDefault: false, translations: { nl: "Extra ijs", en: "Extra ice" } },
    ],
  },
];

async function main() {
  console.log("Adding customization groups...");

  for (const group of customizationGroups) {
    // Check if group already exists
    const existing = await prisma.customizationGroup.findUnique({
      where: { type: group.type },
    });

    if (existing) {
      console.log(`Group ${group.type} already exists, skipping...`);
      continue;
    }

    // Create the group
    const createdGroup = await prisma.customizationGroup.create({
      data: {
        id: crypto.randomUUID(),
        type: group.type,
        sortOrder: group.sortOrder,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    console.log(`Created group: ${group.type}`);

    // Create values for this group
    for (const value of group.values) {
      const createdValue = await prisma.customizationValue.create({
        data: {
          id: crypto.randomUUID(),
          groupId: createdGroup.id,
          value: value.value,
          priceModifier: 0,
          isDefault: value.isDefault,
          isAvailable: true,
          sortOrder: value.sortOrder,
        },
      });

      // Create translations
      await prisma.customizationValueTranslation.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            valueId: createdValue.id,
            locale: "nl",
            label: value.translations.nl,
          },
          {
            id: crypto.randomUUID(),
            valueId: createdValue.id,
            locale: "en",
            label: value.translations.en,
          },
        ],
      });

      console.log(`  Created value: ${value.value}`);
    }
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
