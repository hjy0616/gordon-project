-- Backfill: type-specific defaults for existing rival relations.
-- The previous migration applied ally defaults to all rows, which would silently flip rival
-- relations to blue/solid once the API started returning these non-null values.
UPDATE "country_relations"
SET "color" = '#800020', "line_style" = 'dashed'
WHERE "type" = 'rival' AND "color" = '#3b82f6' AND "line_style" = 'solid';
