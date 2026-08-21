-- Migration: Storage RLS Policies for product-files bucket
-- Allows public select/read and authenticated upload/update/delete for storage objects

DROP POLICY IF EXISTS "Public Select product-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert product-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update product-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete product-files" ON storage.objects;

CREATE POLICY "Public Select product-files" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-files');

CREATE POLICY "Authenticated Insert product-files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "Authenticated Update product-files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-files');

CREATE POLICY "Authenticated Delete product-files" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-files');
