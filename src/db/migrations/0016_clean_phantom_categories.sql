DELETE FROM "categories"
WHERE "name" IN (
  'Mall Shops',
  'Commercial Shops',
  'Food Court',
  'Kiosks',
  'Corporate Offices',
  'Residential Apartments'
)
AND NOT EXISTS (
  SELECT 1 FROM "units" WHERE "units"."category_id" = "categories"."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "unit_merge_requests" WHERE "unit_merge_requests"."target_category_id" = "categories"."id"
);
