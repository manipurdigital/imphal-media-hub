-- Update the collections table to rename kangleiflix-originals to imoinu-originals
UPDATE collections 
SET slug = 'imoinu-originals', 
    name = 'Imoinu Originals',
    description = 'Original content exclusive to Imoinu platform'
WHERE slug = 'kangleiflix-originals';