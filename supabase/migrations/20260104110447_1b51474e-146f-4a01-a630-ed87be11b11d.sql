-- Update existing product_pages with auto-generated slugs based on project name
UPDATE product_pages pp
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(p.name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '[\s]+', '-', 'g'
  )
)
FROM projects p
WHERE pp.project_id = p.id
AND (pp.slug IS NULL OR pp.slug = '');