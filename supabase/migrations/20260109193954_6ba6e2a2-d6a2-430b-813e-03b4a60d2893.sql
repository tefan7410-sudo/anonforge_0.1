-- Add collection type and template-specific fields to product_pages
ALTER TABLE product_pages 
ADD COLUMN collection_type text DEFAULT 'generative',
ADD COLUMN preview_images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN artworks jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN product_pages.collection_type IS 'Type of collection: generative (unique NFTs from layers) or art_collection (single/multiple artworks with editions)';
COMMENT ON COLUMN product_pages.preview_images IS 'Up to 3 preview/example images for generative collections. Structure: [{id, image_url, caption?}]';
COMMENT ON COLUMN product_pages.artworks IS 'Artwork entries for art collections. Structure: [{id, image_url, title, description?, edition_count, price_in_lovelace?}]';