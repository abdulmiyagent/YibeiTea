-- Add Customization Groups for Sugar and Ice levels
-- Run this in Supabase SQL Editor

-- Create Sugar Level group
INSERT INTO "CustomizationGroup" (id, type, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'SUGAR_LEVEL', true, 1, NOW(), NOW())
ON CONFLICT (type) DO NOTHING;

-- Create Ice Level group
INSERT INTO "CustomizationGroup" (id, type, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'ICE_LEVEL', true, 2, NOW(), NOW())
ON CONFLICT (type) DO NOTHING;

-- Get the group IDs
DO $$
DECLARE
    sugar_group_id TEXT;
    ice_group_id TEXT;
BEGIN
    SELECT id INTO sugar_group_id FROM "CustomizationGroup" WHERE type = 'SUGAR_LEVEL';
    SELECT id INTO ice_group_id FROM "CustomizationGroup" WHERE type = 'ICE_LEVEL';

    -- Sugar Level Values
    INSERT INTO "CustomizationValue" (id, "groupId", value, "priceModifier", "isDefault", "isAvailable", "sortOrder")
    VALUES
        (gen_random_uuid(), sugar_group_id, '0', 0, false, true, 1),
        (gen_random_uuid(), sugar_group_id, '25', 0, false, true, 2),
        (gen_random_uuid(), sugar_group_id, '50', 0, false, true, 3),
        (gen_random_uuid(), sugar_group_id, '75', 0, false, true, 4),
        (gen_random_uuid(), sugar_group_id, '100', 0, true, true, 5)
    ON CONFLICT ("groupId", value) DO NOTHING;

    -- Ice Level Values
    INSERT INTO "CustomizationValue" (id, "groupId", value, "priceModifier", "isDefault", "isAvailable", "sortOrder")
    VALUES
        (gen_random_uuid(), ice_group_id, 'none', 0, false, true, 1),
        (gen_random_uuid(), ice_group_id, 'less', 0, false, true, 2),
        (gen_random_uuid(), ice_group_id, 'normal', 0, true, true, 3),
        (gen_random_uuid(), ice_group_id, 'extra', 0, false, true, 4)
    ON CONFLICT ("groupId", value) DO NOTHING;
END $$;

-- Add translations for Sugar Level values
INSERT INTO "CustomizationValueTranslation" (id, "valueId", locale, label)
SELECT gen_random_uuid(), cv.id, 'nl',
    CASE cv.value
        WHEN '0' THEN 'Geen suiker'
        WHEN '25' THEN '25% suiker'
        WHEN '50' THEN '50% suiker'
        WHEN '75' THEN '75% suiker'
        WHEN '100' THEN '100% suiker'
    END
FROM "CustomizationValue" cv
JOIN "CustomizationGroup" cg ON cv."groupId" = cg.id
WHERE cg.type = 'SUGAR_LEVEL'
ON CONFLICT ("valueId", locale) DO NOTHING;

INSERT INTO "CustomizationValueTranslation" (id, "valueId", locale, label)
SELECT gen_random_uuid(), cv.id, 'en',
    CASE cv.value
        WHEN '0' THEN 'No sugar'
        WHEN '25' THEN '25% sugar'
        WHEN '50' THEN '50% sugar'
        WHEN '75' THEN '75% sugar'
        WHEN '100' THEN '100% sugar'
    END
FROM "CustomizationValue" cv
JOIN "CustomizationGroup" cg ON cv."groupId" = cg.id
WHERE cg.type = 'SUGAR_LEVEL'
ON CONFLICT ("valueId", locale) DO NOTHING;

-- Add translations for Ice Level values
INSERT INTO "CustomizationValueTranslation" (id, "valueId", locale, label)
SELECT gen_random_uuid(), cv.id, 'nl',
    CASE cv.value
        WHEN 'none' THEN 'Geen ijs'
        WHEN 'less' THEN 'Weinig ijs'
        WHEN 'normal' THEN 'Normaal'
        WHEN 'extra' THEN 'Extra ijs'
    END
FROM "CustomizationValue" cv
JOIN "CustomizationGroup" cg ON cv."groupId" = cg.id
WHERE cg.type = 'ICE_LEVEL'
ON CONFLICT ("valueId", locale) DO NOTHING;

INSERT INTO "CustomizationValueTranslation" (id, "valueId", locale, label)
SELECT gen_random_uuid(), cv.id, 'en',
    CASE cv.value
        WHEN 'none' THEN 'No ice'
        WHEN 'less' THEN 'Less ice'
        WHEN 'normal' THEN 'Normal'
        WHEN 'extra' THEN 'Extra ice'
    END
FROM "CustomizationValue" cv
JOIN "CustomizationGroup" cg ON cv."groupId" = cg.id
WHERE cg.type = 'ICE_LEVEL'
ON CONFLICT ("valueId", locale) DO NOTHING;

-- Verify
SELECT cg.type, cv.value, cvt.locale, cvt.label
FROM "CustomizationGroup" cg
JOIN "CustomizationValue" cv ON cv."groupId" = cg.id
JOIN "CustomizationValueTranslation" cvt ON cvt."valueId" = cv.id
ORDER BY cg."sortOrder", cv."sortOrder", cvt.locale;
