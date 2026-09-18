ALTER TABLE statements ADD COLUMN document_path text;
ALTER TABLE statements ADD COLUMN raw_text text;
ALTER TABLE statements ADD COLUMN extraction_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE statements ADD COLUMN extraction_provider text;
