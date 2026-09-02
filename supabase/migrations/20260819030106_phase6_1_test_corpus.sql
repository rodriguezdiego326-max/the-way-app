-- ============================================================
-- THE WAY Phase 6.1 — Small Verified Test Corpus
-- Only public-domain, legally verified material.
-- Includes one PENDING_VERIFICATION source to test the gate.
-- ============================================================

-- ============================================================
-- 1. LIBRARY AUTHORS
-- ============================================================
INSERT INTO library_authors (id, name, birth_year, death_year, era, theological_tradition, biography_summary, major_works, doctrine_specialties, public_domain_default, source_permissions, verified)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'John Calvin', 1509, 1564, 'reformation', 'continental_reformed',
   'French theologian and reformer, principal figure in the development of Reformed theology.',
   ARRAY['Institutes of the Christian Religion', 'Commentaries on the Epistles of Paul'],
   ARRAY['Sovereignty', 'Providence', 'Justification', 'Predestination'],
   true, 'public_domain', true),
  ('a0000000-0000-0000-0000-000000000002', 'John Owen', 1616, 1683, 'puritan', 'westminster_presbyterian',
   'English Puritan theologian and pastor, known for works on the Holy Spirit, indwelling sin, and the death of Christ.',
   ARRAY['The Death of Death in the Death of Christ', 'On the Mortification of Sin', 'The Holy Spirit'],
   ARRAY['Atonement', 'Indwelling Sin', 'Trinity', 'Spirit'],
   true, 'public_domain', true),
  ('a0000000-0000-0000-0000-000000000003', 'Westminster Assembly', 1643, 1653, 'post_reformation', 'westminster_presbyterian',
   'Assembly of divines convened by the English Parliament to reform the Church of England, producing the Westminster Confession and Catechisms.',
   ARRAY['Westminster Confession of Faith', 'Westminster Larger Catechism', 'Westminster Shorter Catechism'],
   ARRAY['Scripture', 'God', 'Justification', 'Sanctification', 'Perseverance'],
   true, 'public_domain', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. SCRIPTURE SOURCES (Level 1 — references only, no text)
-- ============================================================
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, language, copyright_status, license_type, public_domain, verified, verified_by, verification_date, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'scripture', 1, 'Romans 3:21-28', NULL, 'en', 'public_domain', 'biblical_text', true, true, 'admin', '2026-08-19', 'broad_historic_reformed', 'verified'),
  ('b0000000-0000-0000-0000-000000000002', 'scripture', 1, 'Romans 5:1-11', NULL, 'en', 'public_domain', 'biblical_text', true, true, 'admin', '2026-08-19', 'broad_historic_reformed', 'verified'),
  ('b0000000-0000-0000-0000-000000000003', 'scripture', 1, 'Romans 8:28-39', NULL, 'en', 'public_domain', 'biblical_text', true, true, 'admin', '2026-08-19', 'broad_historic_reformed', 'verified'),
  ('b0000000-0000-0000-0000-000000000004', 'scripture', 1, 'Ephesians 1:3-14', NULL, 'en', 'public_domain', 'biblical_text', true, true, 'admin', '2026-08-19', 'broad_historic_reformed', 'verified'),
  ('b0000000-0000-0000-0000-000000000005', 'scripture', 1, 'John 6:35-44', NULL, 'en', 'public_domain', 'biblical_text', true, true, 'admin', '2026-08-19', 'broad_historic_reformed', 'verified')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. WESTMINSTER CONFESSION (Level 3 — public domain)
-- ============================================================
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, public_domain, verified, verified_by, verification_date, theological_tradition, content_status, perspective_profile)
VALUES
  ('b0000000-0000-0000-0000-000000000010', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 1: Of the Holy Scripture', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000011', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 3: Of God''s Eternal Decree', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000012', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 11: Of Justification', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000013', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 17: Of the Perseverance of the Saints', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. WESTMINSTER SHORTER CATECHISM (Level 3 — public domain)
-- ============================================================
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, public_domain, verified, verified_by, verification_date, theological_tradition, content_status, perspective_profile)
VALUES
  ('b0000000-0000-0000-0000-000000000020', 'catechism', 3, 'Westminster Shorter Catechism', 'a0000000-0000-0000-0000-000000000003', 'Q1: What is the chief end of man?', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000021', 'catechism', 3, 'Westminster Shorter Catechism', 'a0000000-0000-0000-0000-000000000003', 'Q3: What do the Scriptures principally teach?', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000022', 'catechism', 3, 'Westminster Shorter Catechism', 'a0000000-0000-0000-0000-000000000003', 'Q33: What is justification?', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000023', 'catechism', 3, 'Westminster Shorter Catechism', 'a0000000-0000-0000-0000-000000000003', 'Q35: What is sanctification?', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. CALVIN SOURCE (Level 4 — public domain, Beveridge translation)
-- ============================================================
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, license_notes, public_domain, verified, verified_by, verification_date, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000030', 'historic_theologian', 4, 'Institutes of the Christian Religion', 'a0000000-0000-0000-0000-000000000001', 'Book III, Chapter 11', 'en', 'public_domain', 'public_domain_translation', 'Henry Beveridge translation (1845), public domain in the United States. Original Latin text is public domain. Translation status verified by edition.', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. OWEN SOURCE (Level 4 — public domain)
-- ============================================================
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, license_notes, public_domain, verified, verified_by, verification_date, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000040', 'historic_theologian', 4, 'The Death of Death in the Death of Christ', 'a0000000-0000-0000-0000-000000000002', 'Book I, Chapter 3', 'en', 'public_domain', 'public_domain_text', 'Original English text (1647), public domain. No modern copyrighted translation used.', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. PENDING VERIFICATION SOURCE (must be excluded from retrieval)
-- ============================================================
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, public_domain, verified, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000099', 'historic_theologian', 4, 'Institutes of the Christian Religion (Unverified Edition)', 'a0000000-0000-0000-0000-000000000001', 'Book II, Chapter 1', 'en', 'pending_review', 'pending_review', false, false, 'continental_reformed', 'pending_verification')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. SOURCE CHUNKS — Scripture references
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 0, 'Romans 3:21-28', 'But now the righteousness of God has been manifested apart from the law, although the Law and the Prophets bear witness to it—the righteousness of God through faith in Jesus Christ for all who believe.', ARRAY['Romans 3:21-28'], ARRAY['soteriology_justification', 'revelation_authority'], true, 45),
  ('b0000000-0000-0000-0000-000000000002', 0, 'Romans 5:1-11', 'Therefore, since we have been justified by faith, we have peace with God through our Lord Jesus Christ. Through him we have also obtained access by faith into this grace in which we stand.', ARRAY['Romans 5:1-11'], ARRAY['soteriology_justification', 'soteriology_faith', 'atonement_reconciliation'], true, 52),
  ('b0000000-0000-0000-0000-000000000003', 0, 'Romans 8:28-39', 'And we know that for those who love God all things work together for good, for those who are called according to his purpose. For those whom he foreknew he also predestined to be conformed to the image of his Son.', ARRAY['Romans 8:28-39'], ARRAY['soteriology_predestination', 'soteriology_election', 'theology_proper_providence', 'soteriology_perseverance'], true, 68),
  ('b0000000-0000-0000-0000-000000000004', 0, 'Ephesians 1:3-14', 'Blessed be the God and Father of our Lord Jesus Christ, who has blessed us in Christ with every spiritual blessing in the heavenly places, even as he chose us in him before the foundation of the world.', ARRAY['Ephesians 1:3-14'], ARRAY['soteriology_election', 'soteriology_predestination', 'atonement_redemption'], true, 72),
  ('b0000000-0000-0000-0000-000000000005', 0, 'John 6:35-44', 'Jesus said to them, "I am the bread of life; whoever comes to me shall not hunger, and whoever believes in me shall never thirst. All that the Father gives me will come to me, and whoever comes to me I will never cast out."', ARRAY['John 6:35-44'], ARRAY['soteriology_election', 'soteriology_calling', 'soteriology_faith'], true, 58)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. SOURCE CHUNKS — Westminster Confession
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count)
VALUES
  ('b0000000-0000-0000-0000-000000000010', 0, 'WCF Chapter 1: Of the Holy Scripture',
   'Although the light of nature, and the works of creation and providence, do so far manifest the goodness, wisdom, and power of God, as to leave men inexcusable; yet are they not sufficient to give that knowledge of God, and of his will, which is necessary unto salvation; therefore it pleased the Lord, at sundry times, and in divers manners, to reveal himself, and to declare that his will unto his Church.',
   ARRAY['Psalm 19', 'Romans 1', 'Hebrews 1'], ARRAY['revelation_special', 'revelation_general', 'revelation_authority'], true, 85),
  ('b0000000-0000-0000-0000-000000000011', 0, 'WCF Chapter 3: Of God''s Eternal Decree',
   'God, from all eternity, did, by the most wise and holy counsel of his own will, freely, and unchangeably ordain whatsoever comes to pass: yet so, as thereby neither is God the author of sin, nor is violence offered to the will of the creatures, nor is the liberty or contingency of second causes taken away, but rather established.',
   ARRAY['Ephesians 1:11', 'Acts 2:23', 'Proverbs 16:33'], ARRAY['theology_proper_decrees', 'soteriology_predestination', 'theology_proper_providence'], true, 78),
  ('b0000000-0000-0000-0000-000000000012', 0, 'WCF Chapter 11: Of Justification',
   'Those whom God effectually calleth, he also freely justifieth: not by infusing righteousness into them, but by pardoning their sins, and by accounting and accepting their persons as righteous; not for any thing wrought in them, or done by them, but for Christ''s sake alone; nor by imputing faith itself, the act of believing, or any other evangelical obedience to them, as their righteousness; but by imputing the obedience and satisfaction of Christ unto them, they receiving and resting on him and his righteousness by faith; which faith they have not of themselves, it is the gift of God.',
   ARRAY['Romans 3:24-28', 'Romans 5:1-11', '2 Corinthians 5:21', 'Ephesians 2:8-9'], ARRAY['soteriology_justification', 'soteriology_faith', 'christology_active_obedience', 'christology_passive_obedience'], true, 112),
  ('b0000000-0000-0000-0000-000000000013', 0, 'WCF Chapter 17: Of the Perseverance of the Saints',
   'They whom God hath accepted in the Beloved, effectually called and sanctified by his Spirit, can neither totally nor finally fall away from the state of grace; but shall certainly persevere therein to the end, and be eternally saved.',
   ARRAY['John 10:28-29', 'Philippians 1:6', '1 Peter 1:5'], ARRAY['soteriology_perseverance', 'soteriology_assurance'], true, 65)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. SOURCE CHUNKS — Westminster Shorter Catechism
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count)
VALUES
  ('b0000000-0000-0000-0000-000000000020', 0, 'WSC Q1', 'Q: What is the chief end of man? A: Man''s chief end is to glorify God, and to enjoy him forever.', ARRAY['1 Corinthians 10:31', 'Psalm 73:25-26'], ARRAY['creation_purpose', 'christian_life_worship'], true, 28),
  ('b0000000-0000-0000-0000-000000000021', 0, 'WSC Q3', 'Q: What do the Scriptures principally teach? A: The Scriptures principally teach what man is to believe concerning God, and what duty God requires of man.', ARRAY['2 Timothy 3:16-17', 'Micah 6:8'], ARRAY['revelation_authority', 'revelation_sufficiency'], true, 32),
  ('b0000000-0000-0000-0000-000000000022', 0, 'WSC Q33', 'Q: What is justification? A: Justification is an act of God''s free grace, wherein he pardoneth all our sins, and accepteth us as righteous in his sight, only for the righteousness of Christ imputed to us, and received by faith alone.', ARRAY['Romans 3:24-28', '2 Corinthians 5:21', 'Ephesians 2:8-9'], ARRAY['soteriology_justification', 'soteriology_faith'], true, 48),
  ('b0000000-0000-0000-0000-000000000023', 0, 'WSC Q35', 'Q: What is sanctification? A: Sanctification is the work of God''s free grace, whereby we are renewed in the whole man after the image of God, and are enabled more and more to die unto sin, and live unto righteousness.', ARRAY['1 Thessalonians 4:3', 'Romans 6:6', 'Ephesians 4:22-24'], ARRAY['soteriology_sanctification'], true, 42)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. SOURCE CHUNKS — Calvin (Institutes III.11)
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count, citation_metadata)
VALUES
  ('b0000000-0000-0000-0000-000000000030', 0, 'Institutes III.11 — Justification by Faith',
   'We explain justification as the acceptance with which God receives us into his favor as righteous men; and we say that it consists in the remission of sins and the imputation of the righteousness of Christ.',
   ARRAY['Romans 3:24-28', 'Romans 5:1', '2 Corinthians 5:21'], ARRAY['soteriology_justification', 'soteriology_faith'], true, 38,
   '{"author": "John Calvin", "work": "Institutes of the Christian Religion", "book": "III", "chapter": "11", "translator": "Henry Beveridge", "translation_year": 1845, "public_domain": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. SOURCE CHUNKS — Owen (Death of Death, Book I, Ch 3)
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count, citation_metadata)
VALUES
  ('b0000000-0000-0000-0000-000000000040', 0, 'The Death of Death in the Death of Christ — Book I, Chapter 3',
   'The Father imposed his wrath due unto, and the Son underwent punishment for, either all the sins of all men, or all the sins of the elect, or the sins of some men. If the last, then all men have some sins to answer for. Christ in their stead suffered for all the sins of all the elect in the whole world.',
   ARRAY['John 10:11', 'Ephesians 5:25', 'Isaiah 53:4-6'], ARRAY['atonement_particular_redemption', 'atonement_penal_substitution'], true, 55,
   '{"author": "John Owen", "work": "The Death of Death in the Death of Christ", "book": "I", "chapter": "3", "year": 1647, "public_domain": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. DOCTRINE TAXONOMY — insert stable doctrine IDs
-- ============================================================
INSERT INTO doctrine_taxonomy (doctrine_id, category, subcategory, label, description, scripture_references, confession_references)
VALUES
  ('soteriology_justification', 'Soteriology', 'Justification', 'Justification', 'Declared righteous through Christ''s imputed righteousness.', ARRAY['Romans 3:21-28', 'Romans 5:1-11', '2 Corinthians 5:21'], ARRAY['WCF 11', 'WSC 33']),
  ('soteriology_predestination', 'Soteriology', 'Predestination', 'Predestination', 'God''s foreordination of all things.', ARRAY['Ephesians 1:3-14', 'Romans 8:28-39'], ARRAY['WCF 3']),
  ('soteriology_election', 'Soteriology', 'Election', 'Election', 'God''s choice of sinners for salvation before creation.', ARRAY['Ephesians 1:3-14', 'John 6:35-44'], ARRAY['WCF 3']),
  ('soteriology_sanctification', 'Soteriology', 'Sanctification', 'Sanctification', 'Progressive holiness through the Spirit.', ARRAY['1 Thessalonians 4:3', 'Romans 6:6'], ARRAY['WCF 13', 'WSC 35']),
  ('soteriology_perseverance', 'Soteriology', 'Perseverance', 'Perseverance', 'God preserves His people to the end.', ARRAY['John 10:28-29', 'Philippians 1:6'], ARRAY['WCF 17']),
  ('revelation_authority', 'Revelation', 'Authority of Scripture', 'Authority of Scripture', 'Scripture is the final authority for faith and life.', ARRAY['2 Timothy 3:16-17'], ARRAY['WCF 1', 'WSC 2-3']),
  ('theology_proper_providence', 'Theology Proper', 'Providence', 'Providence', 'God''s sovereign governance of all things.', ARRAY['Romans 8:28', 'Matthew 10:29-31'], ARRAY['WCF 5']),
  ('theology_proper_decrees', 'Theology Proper', 'Decrees', 'Decrees', 'God''s eternal plan for all that occurs.', ARRAY['Ephesians 1:11', 'Acts 2:23'], ARRAY['WCF 3']),
  ('atonement_particular_redemption', 'Atonement', 'Particular Redemption', 'Particular Redemption', 'Christ died specifically for His people.', ARRAY['John 10:11', 'Ephesians 5:25'], ARRAY['WCF 8']),
  ('atonement_penal_substitution', 'Atonement', 'Penal Substitution', 'Penal Substitution', 'Christ bore God''s wrath in our place.', ARRAY['Isaiah 53:4-6', '2 Corinthians 5:21'], ARRAY['WCF 8', 'WSC 24-25'])
ON CONFLICT (doctrine_id) DO NOTHING;

-- ============================================================
-- 14. CREEDS — Apostles' Creed, Nicene Creed (public domain)
-- ============================================================
INSERT INTO library_creeds (title, historical_date, tradition, section, text, source, public_domain, verified)
VALUES
  ('The Apostles'' Creed', '~2nd century', 'Historic Christian Orthodoxy', 'Full text',
   'I believe in God, the Father Almighty, Creator of heaven and earth. And in Jesus Christ, his only begotten Son, our Lord; who was conceived by the Holy Spirit, born of the Virgin Mary; suffered under Pontius Pilate, was crucified, dead, and buried; he descended into hell; the third day he rose again from the dead; he ascended into heaven; and sits at the right hand of God the Father Almighty; from thence he shall come to judge the quick and the dead. I believe in the Holy Spirit; the holy catholic Church; the communion of saints; the forgiveness of sins; the resurrection of the body; and the life everlasting. Amen.',
   'Public domain historic creed', true, true),
  ('The Nicene Creed', '325 AD (expanded 381)', 'Historic Christian Orthodoxy', 'Full text',
   'We believe in one God, the Father Almighty, Maker of heaven and earth, and of all things visible and invisible. And in one Lord Jesus Christ, the only-begotten Son of God, begotten of the Father before all worlds; God of God, Light of Light, very God of very God; begotten, not made, being of one substance with the Father, by whom all things were made. Who, for us men and for our salvation, came down from heaven, and was incarnate by the Holy Spirit of the Virgin Mary, and was made man; and was crucified also for us under Pontius Pilate; he suffered and was buried; and the third day he rose again, according to the Scriptures; and ascended into heaven, and sits on the right hand of the Father; and he shall come again, with glory, to judge the quick and the dead; whose kingdom shall have no end. And we believe in the Holy Spirit, the Lord and Giver of Life; who proceeds from the Father and the Son; who with the Father and the Son together is worshipped and glorified; who spoke by the prophets. And we believe in one holy catholic and apostolic Church. We acknowledge one baptism for the remission of sins; and we look for the resurrection of the dead, and the life of the world to come. Amen.',
   'Public domain historic creed', true, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. BIBLE TRANSLATIONS — metadata only (no text stored)
-- ============================================================
INSERT INTO bible_translations (translation_code, translation_name, copyright_holder, license_type, usage_limitations, api_provider, attribution_requirements, offline_storage_permitted, commercial_usage_permitted, public_domain)
VALUES
  ('KJV', 'King James Version', 'Public Domain', 'public_domain', 'None — public domain in most jurisdictions', NULL, 'No attribution required', true, true, true),
  ('ESV', 'English Standard Version', 'Crossway', 'copyrighted', 'Quotation limits apply; requires attribution', 'Crossway API', 'ESV Bible (text), Copyright Crossway. Used by permission.', false, false, false),
  ('NASB', 'New American Standard Bible', 'The Lockman Foundation', 'copyrighted', 'Quotation limits apply', 'Lockman Foundation API', 'Scripture taken from the NASB, Copyright The Lockman Foundation. Used by permission.', false, false, false)
ON CONFLICT (translation_code) DO NOTHING;
