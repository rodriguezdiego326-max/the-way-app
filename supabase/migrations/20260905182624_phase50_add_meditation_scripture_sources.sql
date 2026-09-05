-- Add Scripture sources for meditation/study/consistency topics
-- These are needed so that questions about "consistent Scripture learning" retrieve
-- relevant passages instead of falling back to all authority_level=1 sources

INSERT INTO library_sources (id, title, source_type, authority_level, content_status, verified, chapter, section)
VALUES
  ('b0000000-0000-0000-0000-000000000006', 'Joshua 1:8', 'scripture', 1, 'verified', true, null, null),
  ('b0000000-0000-0000-0000-000000000007', 'Psalm 1:1-3', 'scripture', 1, 'verified', true, null, null),
  ('b0000000-0000-0000-0000-000000000008', '2 Timothy 3:14-17', 'scripture', 1, 'verified', true, null, null),
  ('b0000000-0000-0000-0000-000000000009', 'James 1:22-25', 'scripture', 1, 'verified', true, null, null),
  ('b0000000-0000-0000-0000-00000000000a', 'Deuteronomy 6:6-7', 'scripture', 1, 'verified', true, null, null)
ON CONFLICT (id) DO NOTHING;

-- Add source chunks with doctrine tags for meditation/study
INSERT INTO source_chunks (source_id, chunk_index, heading, text, doctrine_tags, verified)
VALUES
  ('b0000000-0000-0000-0000-000000000006', 0, 'Joshua 1:8', 'This Book of the Law shall not depart from your mouth, but you shall meditate on it day and night, so that you may be careful to do according to all that is written in it. For then you will make your way prosperous, and then you will have good success.', ARRAY['revelation_sufficiency', 'christian_life_diligence', 'revelation_authority'], true),
  ('b0000000-0000-0000-0000-000000000007', 0, 'Psalm 1:1-3', 'Blessed is the man who walks not in the counsel of the wicked, nor stands in the way of sinners, nor sits in the seat of scoffers; but his delight is in the law of the LORD, and on his law he meditates day and night. He is like a tree planted by streams of water that yields its fruit in its season.', ARRAY['revelation_sufficiency', 'christian_life_diligence', 'revelation_authority'], true),
  ('b0000000-0000-0000-0000-000000000008', 0, '2 Timothy 3:14-17', 'But as for you, continue in what you have learned and have firmly believed, knowing from whom you learned it and how from childhood you have been acquainted with the sacred writings, which are able to make you wise for salvation through faith in Christ Jesus. All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness, that the man of God may be complete, equipped for every good work.', ARRAY['revelation_sufficiency', 'revelation_authority', 'christian_life_diligence'], true),
  ('b0000000-0000-0000-0000-000000000009', 0, 'James 1:22-25', 'But be doers of the word, and not hearers only, deceiving yourselves. For if anyone is a hearer of the word and not a doer, he is like a man who looks intently at his natural face in a mirror and goes away and at once forgets what he was like. But the one who looks into the perfect law, the law of liberty, and perseveres, being no hearer who forgets but a doer who acts, he will be blessed in his doing.', ARRAY['revelation_sufficiency', 'christian_life_diligence'], true),
  ('b0000000-0000-0000-0000-00000000000a', 0, 'Deuteronomy 6:6-7', 'And these words that I command you today shall be on your heart. You shall teach them diligently to your children, and shall talk of them when you sit in your house, and when you walk by the way, and when you lie down, and when you rise.', ARRAY['revelation_sufficiency', 'christian_life_diligence', 'revelation_authority'], true)
ON CONFLICT DO NOTHING;
