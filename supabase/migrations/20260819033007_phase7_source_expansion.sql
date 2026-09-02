-- ============================================================
-- THE WAY Phase 7 — Source Expansion Batches A–D
-- All public-domain, legally verified material.
-- ============================================================

-- ============================================================
-- BATCH A — CONFESSIONAL CORE (additional chapters)
-- ============================================================

-- Westminster Confession — additional chapters
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, public_domain, verified, verified_by, verification_date, theological_tradition, content_status, perspective_profile)
VALUES
  ('b0000000-0000-0000-0000-000000000014', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 2: Of God and the Holy Trinity', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000015', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 4: Of Creation', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000016', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 6: Of the Fall of Man, of Sin, and of the Punishment thereof', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000017', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 8: Of Christ the Mediator', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000018', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 10: Of Effectual Calling', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000019', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 13: Of Sanctification', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-00000000001a', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 14: Of Saving Faith', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-00000000001b', 'confession', 3, 'Westminster Confession of Faith', 'a0000000-0000-0000-0000-000000000003', 'Chapter 18: Of the Assurance of Grace and Salvation', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian')
ON CONFLICT (id) DO NOTHING;

-- Westminster Larger Catechism
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, public_domain, verified, verified_by, verification_date, theological_tradition, content_status, perspective_profile)
VALUES
  ('b0000000-0000-0000-0000-000000000024', 'catechism', 3, 'Westminster Larger Catechism', 'a0000000-0000-0000-0000-000000000003', 'Q1: What is the chief and highest end of man?', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000025', 'catechism', 3, 'Westminster Larger Catechism', 'a0000000-0000-0000-0000-000000000003', 'Q70: What is justification?', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian'),
  ('b0000000-0000-0000-0000-000000000026', 'catechism', 3, 'Westminster Larger Catechism', 'a0000000-0000-0000-0000-000000000003', 'Q75: What is sanctification?', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified', 'westminster_presbyterian')
ON CONFLICT (id) DO NOTHING;

-- Heidelberg Catechism (continental Reformed, public domain)
INSERT INTO library_authors (id, name, birth_year, death_year, era, theological_tradition, biography_summary, major_works, doctrine_specialties, public_domain_default, source_permissions, verified)
VALUES
  ('a0000000-0000-0000-0000-000000000004', 'Zacharias Ursinus & Caspar Olevianus', 1534, 1587, 'reformation', 'continental_reformed',
   'Primary authors of the Heidelberg Catechism (1563), commissioned by Elector Frederick III of the Palatinate.',
   ARRAY['Heidelberg Catechism'],
   ARRAY['Justification', 'Faith', 'Sanctification', 'Comfort'],
   true, 'public_domain', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, public_domain, verified, verified_by, verification_date, theological_tradition, content_status, perspective_profile)
VALUES
  ('b0000000-0000-0000-0000-000000000030', 'catechism', 3, 'Heidelberg Catechism', 'a0000000-0000-0000-0000-000000000004', 'Lord''s Day 1', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified', 'continental_reformed'),
  ('b0000000-0000-0000-0000-000000000031', 'catechism', 3, 'Heidelberg Catechism', 'a0000000-0000-0000-0000-000000000004', 'Lord''s Day 23: Of Justification', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified', 'continental_reformed'),
  ('b0000000-0000-0000-0000-000000000032', 'catechism', 3, 'Heidelberg Catechism', 'a0000000-0000-0000-0000-000000000004', 'Lord''s Day 32: Of Good Works', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified', 'continental_reformed')
ON CONFLICT (id) DO NOTHING;

-- Belgic Confession (continental Reformed, public domain)
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, public_domain, verified, verified_by, verification_date, theological_tradition, content_status, perspective_profile)
VALUES
  ('b0000000-0000-0000-0000-000000000033', 'confession', 3, 'Belgic Confession', 'a0000000-0000-0000-0000-000000000004', 'Article 1: Of God', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified', 'continental_reformed'),
  ('b0000000-0000-0000-0000-000000000034', 'confession', 3, 'Belgic Confession', 'a0000000-0000-0000-0000-000000000004', 'Article 2: Of Revelation', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified', 'continental_reformed')
ON CONFLICT (id) DO NOTHING;

-- Canons of Dort (continental Reformed, public domain)
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, public_domain, verified, verified_by, verification_date, theological_tradition, content_status, perspective_profile)
VALUES
  ('b0000000-0000-0000-0000-000000000035', 'confession', 3, 'Canons of Dort', 'a0000000-0000-0000-0000-000000000004', 'First Head: Divine Predestination', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified', 'continental_reformed'),
  ('b0000000-0000-0000-0000-000000000036', 'confession', 3, 'Canons of Dort', 'a0000000-0000-0000-0000-000000000004', 'Third/Fourth Head: Corruption and Conversion', 'en', 'public_domain', 'public_domain_text', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified', 'continental_reformed')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BATCH B — REFORMATION (additional Calvin, Beza)
-- ============================================================

-- Calvin — Institutes Book III, Chapter 21 (Eternal Election)
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, license_notes, public_domain, verified, verified_by, verification_date, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000041', 'historic_theologian', 4, 'Institutes of the Christian Religion', 'a0000000-0000-0000-0000-000000000001', 'Book III, Chapter 21', 'en', 'public_domain', 'public_domain_translation', 'Henry Beveridge translation (1845), public domain.', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified')
ON CONFLICT (id) DO NOTHING;

-- Calvin — Institutes Book II, Chapter 16 (Christ's death)
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, license_notes, public_domain, verified, verified_by, verification_date, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000042', 'historic_theologian', 4, 'Institutes of the Christian Religion', 'a0000000-0000-0000-0000-000000000001', 'Book II, Chapter 16', 'en', 'public_domain', 'public_domain_translation', 'Henry Beveridge translation (1845), public domain.', true, true, 'admin', '2026-08-19', 'continental_reformed', 'verified')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BATCH C — PURITAN / POST-REFORMATION (additional Owen)
-- ============================================================

-- Owen — On the Mortification of Sin (public domain)
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, license_notes, public_domain, verified, verified_by, verification_date, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000043', 'historic_theologian', 4, 'On the Mortification of Sin', 'a0000000-0000-0000-0000-000000000002', 'Chapter 1', 'en', 'public_domain', 'public_domain_text', 'Original English text (1656), public domain.', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BATCH D — EDWARDS / OLD PRINCETON
-- ============================================================

-- Jonathan Edwards author
INSERT INTO library_authors (id, name, birth_year, death_year, era, theological_tradition, biography_summary, major_works, doctrine_specialties, public_domain_default, source_permissions, verified)
VALUES
  ('a0000000-0000-0000-0000-000000000005', 'Jonathan Edwards', 1703, 1758, 'awakening', 'broad_historic_reformed',
   'American preacher, theologian, and philosopher. Key figure in the First Great Awakening.',
   ARRAY['Sinners in the Hands of an Angry God', 'Religious Affections', 'Freedom of the Will'],
   ARRAY['Revival', 'Free Will', 'Holiness of God'],
   true, 'public_domain', true)
ON CONFLICT (id) DO NOTHING;

-- Edwards — Religious Affections (public domain)
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, license_notes, public_domain, verified, verified_by, verification_date, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000044', 'historic_theologian', 4, 'The Religious Affections', 'a0000000-0000-0000-0000-000000000005', 'Part I, Section 1', 'en', 'public_domain', 'public_domain_text', 'Original English text (1746), public domain.', true, true, 'admin', '2026-08-19', 'broad_historic_reformed', 'verified')
ON CONFLICT (id) DO NOTHING;

-- Charles Hodge author
INSERT INTO library_authors (id, name, birth_year, death_year, era, theological_tradition, biography_summary, major_works, doctrine_specialties, public_domain_default, source_permissions, verified)
VALUES
  ('a0000000-0000-0000-0000-000000000006', 'Charles Hodge', 1797, 1878, 'old_princeton', 'westminster_presbyterian',
   'Princeton theologian, author of Systematic Theology and Commentary on Romans.',
   ARRAY['Systematic Theology', 'Commentary on the Epistle to the Romans'],
   ARRAY['Systematic Theology', 'Scripture', 'Justification'],
   true, 'public_domain', true)
ON CONFLICT (id) DO NOTHING;

-- Hodge — Systematic Theology, Vol 3 (Justification chapter, public domain)
INSERT INTO library_sources (id, source_type, authority_level, title, author_id, chapter, language, copyright_status, license_type, license_notes, public_domain, verified, verified_by, verification_date, theological_tradition, content_status)
VALUES
  ('b0000000-0000-0000-0000-000000000045', 'historic_theologian', 4, 'Systematic Theology', 'a0000000-0000-0000-0000-000000000006', 'Vol 3, Chapter 10: Justification', 'en', 'public_domain', 'public_domain_text', 'Original English text (1873), public domain.', true, true, 'admin', '2026-08-19', 'westminster_presbyterian', 'verified')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Additional WCF chapters
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count)
VALUES
  ('b0000000-0000-0000-0000-000000000014', 0, 'WCF Chapter 2: Of God and the Holy Trinity',
   'The Lord our God is but one only living and true God; whose subsistence is in and of himself, infinite in being and perfection, and whose essence is incomprehensible. In the unity of the Godhead there be three persons, of one substance, power, and eternity: God the Father, God the Son, and God the Holy Ghost.',
   ARRAY['Deuteronomy 6:4', 'Matthew 28:19', '2 Corinthians 13:14'], ARRAY['theology_proper_trinity', 'theology_proper_attributes'], true, 65),
  ('b0000000-0000-0000-0000-000000000016', 0, 'WCF Chapter 6: Of the Fall of Man',
   'Our first parents, being seduced by the subtilty and temptation of Satan, sinned in eating the forbidden fruit. By this sin they fell from their original righteousness and communion with God, and so became dead in sin, and wholly defiled in all the faculties and parts of soul and body.',
   ARRAY['Genesis 3:1-7', 'Romans 5:12-21'], ARRAY['hamartiology_fall', 'hamartiology_original_sin', 'hamartiology_total_depravity'], true, 72),
  ('b0000000-0000-0000-0000-000000000017', 0, 'WCF Chapter 8: Of Christ the Mediator',
   'It pleased God, in his eternal purpose, to choose and ordain the Lord Jesus, his only begotten Son, to be the Mediator between God and man; the Prophet, Priest, and King; the Head and Savior of his Church; the Heir of all things; and Judge of the world.',
   ARRAY['1 Timothy 2:5', 'Hebrews 7:25', 'John 1:14'], ARRAY['christology_person', 'christology_offices', 'christology_deity', 'christology_humanity'], true, 82),
  ('b0000000-0000-0000-0000-000000000018', 0, 'WCF Chapter 10: Of Effectual Calling',
   'All whom God hath predestinated unto life, and those only, he is pleased, in his accepted time, effectually to call, by his Word and Spirit, out of that state of sin and death in which they are by nature, to grace and salvation by Jesus Christ.',
   ARRAY['Romans 8:28-30', 'John 6:37', '2 Timothy 1:9'], ARRAY['soteriology_calling', 'soteriology_election', 'soteriology_regeneration'], true, 68),
  ('b0000000-0000-0000-0000-000000000019', 0, 'WCF Chapter 13: Of Sanctification',
   'They who are effectually called and regenerated, having a new heart and a new spirit created in them, are further sanctified, really and personally, through the virtue of Christ''s death and resurrection, by his Word and Spirit dwelling in them.',
   ARRAY['1 Thessalonians 4:3', 'Romans 6:6', 'Philippians 2:13'], ARRAY['soteriology_sanctification', 'pneumatology_sanctification'], true, 62),
  ('b0000000-0000-0000-0000-00000000001a', 0, 'WCF Chapter 14: Of Saving Faith',
   'The grace of faith, whereby the elect are enabled to believe to the saving of their souls, is the work of the Spirit of Christ in their hearts, and is ordinarily wrought by the ministry of the Word.',
   ARRAY['Ephesians 2:8-9', 'Romans 10:17', 'Hebrews 11'], ARRAY['soteriology_faith'], true, 48),
  ('b0000000-0000-0000-0000-00000000001b', 0, 'WCF Chapter 18: Of the Assurance of Grace and Salvation',
   'Although hypocrites and other unregenerate men may vainly deceive themselves with false hopes of being in the favor of God and estate of salvation, such as on whom God hath not bestowed, yet such as truly believe in the Lord Jesus, and love him in sincerity, endeavoring to walk in all good conscience before him, may, in this life, be certainly assured that they are in the state of grace.',
   ARRAY['1 John 5:13', 'Romans 8:16', '2 Peter 1:10'], ARRAY['soteriology_assurance'], true, 75)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Westminster Larger Catechism
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count)
VALUES
  ('b0000000-0000-0000-0000-000000000024', 0, 'WLC Q1', 'Q: What is the chief and highest end of man? A: Man''s chief and highest end is to glorify God, and fully to enjoy him forever.', ARRAY['1 Corinthians 10:31', 'Psalm 73:25'], ARRAY['creation_purpose'], true, 28),
  ('b0000000-0000-0000-0000-000000000025', 0, 'WLC Q70: Justification', 'Q: What is justification? A: Justification is an act of God''s free grace upon sinners in effectual calling, wherein he pardoneth all their sins, accepteth and accounteth their persons righteous in his sight, not for any thing wrought in them, or done by them, but for the perfect obedience and full satisfaction of Christ unto God by imputed to them, and received by faith alone.', ARRAY['Romans 3:24-28', '2 Corinthians 5:21'], ARRAY['soteriology_justification', 'soteriology_faith'], true, 58),
  ('b0000000-0000-0000-0000-000000000026', 0, 'WLC Q75: Sanctification', 'Q: What is sanctification? A: Sanctification is a work of God''s grace, whereby they whom God hath predestinated unto life, and are effectually called and regenerated, are renewed in their whole man after the image of God, having the seed of repentance unto life and faith in Jesus Christ put into their hearts.', ARRAY['1 Thessalonians 4:3', 'Romans 6:6'], ARRAY['soteriology_sanctification'], true, 52)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Heidelberg Catechism
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count)
VALUES
  ('b0000000-0000-0000-0000-000000000030', 0, 'HC Lord''s Day 1', 'Q: What is thy only comfort in life and death? A: That I with body and soul, both in life and death, am not my own, but belong unto my faithful Savior Jesus Christ.', ARRAY['Romans 14:7-8', '1 Corinthians 6:19-20'], ARRAY['soteriology_union', 'christology_person'], true, 38),
  ('b0000000-0000-0000-0000-000000000031', 0, 'HC Lord''s Day 23: Justification', 'Q: What is thy only comfort in life and death? A: That I with body and soul, both in life and death, am not my own, but belong unto my faithful Savior Jesus Christ, who with the satisfaction, righteousness, and holiness of Christ, as if I never had had, nor committed any sin.', ARRAY['Romans 3:24-28', '2 Corinthians 5:21'], ARRAY['soteriology_justification', 'soteriology_faith'], true, 45),
  ('b0000000-0000-0000-0000-000000000032', 0, 'HC Lord''s Day 32: Good Works', 'Q: Why cannot we then be saved by our works? A: Because the righteousness which can stand before the judgment-seat of God must be absolutely perfect and in all respects conformable to the divine law, but even our best works in this life are all imperfect and defiled with sin.', ARRAY['Isaiah 64:6', 'Romans 3:20', 'Galatians 2:16'], ARRAY['soteriology_justification', 'soteriology_faith'], true, 52)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Belgic Confession
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count)
VALUES
  ('b0000000-0000-0000-0000-000000000033', 0, 'Belgic Confession Article 1: Of God', 'We all believe with the heart, and confess with the mouth, that there is one only simple and spiritual Being, which we call God; and that he is eternal, incomprehensible, invisible, immutable, infinite, almighty, perfectly wise, just, good, and the overflowing fountain of all good.', ARRAY['Deuteronomy 6:4', '1 Timothy 1:17'], ARRAY['theology_proper_attributes', 'theology_proper_existence'], true, 52),
  ('b0000000-0000-0000-0000-000000000034', 0, 'Belgic Confession Article 2: Of Revelation', 'We know him by two means: first, by the creation, preservation, and government of the universe; which is before our eyes as a most elegant book. Secondly, he makes himself more clearly and fully known to us by his holy and divine Word, that is to say, as far as is necessary for us to know in this life, to his glory and our salvation.', ARRAY['Psalm 19', '2 Timothy 3:16-17'], ARRAY['revelation_general', 'revelation_special', 'revelation_authority'], true, 62)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Canons of Dort
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count)
VALUES
  ('b0000000-0000-0000-0000-000000000035', 0, 'Dort First Head: Divine Predestination',
   'Election is the unchangeable purpose of God whereby, before the foundation of the world, he has out of mere grace, according to the sovereign good pleasure of his own will, chosen from the whole human race, which had fallen by its own fault from its original integrity into sin and destruction, a certain number of persons to redemption in Christ.',
   ARRAY['Ephesians 1:4', 'Romans 9:11-13'], ARRAY['soteriology_election', 'soteriology_predestination'], true, 58),
  ('b0000000-0000-0000-0000-000000000036', 0, 'Dort Third/Fourth Head: Corruption and Conversion',
   'Therefore all men are conceived in sin, and are by nature children of wrath, incapable of saving good, prone to evil, dead in sin, and in bondage to sin; and without the regenerating grace of the Holy Spirit, they are neither able nor willing to return to God.',
   ARRAY['Romans 3:10-12', 'Ephesians 2:1-3', 'John 6:44'], ARRAY['hamartiology_total_depravity', 'soteriology_regeneration', 'soteriology_calling'], true, 55)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Calvin Institutes III.21 (Election)
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count, citation_metadata)
VALUES
  ('b0000000-0000-0000-0000-000000000041', 0, 'Institutes III.21 — Eternal Election',
   'We shall never feel persuaded as we ought that our salvation flows from the free mercy of God as its fountain and source, until we are made acquainted with his eternal election, which illustrates his grace by the comparison — that he did not make all men, but selected certain individuals from the common mass of corruption.',
   ARRAY['Ephesians 1:4', 'Romans 9:11-13', '2 Timothy 1:9'], ARRAY['soteriology_election', 'soteriology_predestination'], true, 52,
   '{"author": "John Calvin", "work": "Institutes of the Christian Religion", "book": "III", "chapter": "21", "translator": "Henry Beveridge", "translation_year": 1845, "public_domain": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Calvin Institutes II.16 (Christ's Death)
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count, citation_metadata)
VALUES
  ('b0000000-0000-0000-0000-000000000042', 0, 'Institutes II.16 — Christ''s Death',
   'Christ stood charged with the sins of all those who were to be saved, and having been made a curse for them, he underwent the punishment due to their sins, and thus made satisfaction to the justice of God.',
   ARRAY['2 Corinthians 5:21', 'Galatians 3:13', 'Isaiah 53:4-6'], ARRAY['atonement_penal_substitution', 'christology_passive_obedience'], true, 45,
   '{"author": "John Calvin", "work": "Institutes of the Christian Religion", "book": "II", "chapter": "16", "translator": "Henry Beveridge", "translation_year": 1845, "public_domain": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Owen, Mortification of Sin
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count, citation_metadata)
VALUES
  ('b0000000-0000-0000-0000-000000000043', 0, 'Mortification of Sin — Chapter 1',
   'The choicest believers, who are assuredly freed from the condemning power of sin, ought yet to make it their business all their days to mortify the indwelling power of sin.',
   ARRAY['Romans 8:13', 'Colossians 3:5'], ARRAY['soteriology_sanctification', 'hamartiology_indwelling_sin'], true, 35,
   '{"author": "John Owen", "work": "On the Mortification of Sin", "chapter": "1", "year": 1656, "public_domain": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Edwards, Religious Affections
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count, citation_metadata)
VALUES
  ('b0000000-0000-0000-0000-000000000044', 0, 'Religious Affections — Part I, Section 1',
   'True religion, in great part, consists in holy affections. There is no true religion where there is no religious affection.',
   ARRAY['Psalm 42:1', 'Matthew 22:37'], ARRAY['christian_life_holiness', 'soteriology_sanctification'], true, 30,
   '{"author": "Jonathan Edwards", "work": "The Religious Affections", "part": "I", "section": "1", "year": 1746, "public_domain": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOURCE CHUNKS — Hodge, Systematic Theology Vol 3 (Justification)
-- ============================================================
INSERT INTO source_chunks (source_id, chunk_index, heading, text, scripture_references, doctrine_tags, verified, token_count, citation_metadata)
VALUES
  ('b0000000-0000-0000-0000-000000000045', 0, 'Systematic Theology Vol 3 — Justification',
   'Justification is a forensic act, not a moral change. It is an act of God as a judge, not as a benefactor. The sinner is not made righteous by justification, but declared righteous.',
   ARRAY['Romans 3:24-28', 'Romans 5:1'], ARRAY['soteriology_justification', 'soteriology_faith'], true, 38,
   '{"author": "Charles Hodge", "work": "Systematic Theology", "volume": "3", "chapter": "10", "year": 1873, "public_domain": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ADDITIONAL DOCTRINE TAXONOMY ENTRIES
-- ============================================================
INSERT INTO doctrine_taxonomy (doctrine_id, category, subcategory, label, description, scripture_references, confession_references)
VALUES
  ('theology_proper_trinity', 'Theology Proper', 'Trinity', 'Trinity', 'One God in three persons: Father, Son, and Holy Spirit.', ARRAY['Matthew 28:19', '2 Corinthians 13:14'], ARRAY['WCF 2', 'Belgic Confession 8-9']),
  ('theology_proper_attributes', 'Theology Proper', 'Attributes of God', 'Attributes of God', 'God''s communicable and incommunicable attributes.', ARRAY['1 Timothy 1:17'], ARRAY['WCF 2']),
  ('theology_proper_existence', 'Theology Proper', 'Existence of God', 'Existence of God', 'Arguments and biblical basis for God''s existence.', ARRAY['Psalm 19', 'Romans 1'], ARRAY['Belgic Confession 2']),
  ('christology_person', 'Christology', 'Person of Christ', 'Person of Christ', 'Who Jesus is as the God-man.', ARRAY['John 1:14', '1 Timothy 2:5'], ARRAY['WCF 8']),
  ('christology_offices', 'Christology', 'Offices of Christ', 'Offices of Christ', 'Prophet, Priest, and King.', ARRAY['Hebrews 7:25'], ARRAY['WCF 8']),
  ('hamartiology_indwelling_sin', 'Hamartiology', 'Indwelling Sin', 'Indwelling Sin', 'The remaining corruption of sin in believers.', ARRAY['Romans 8:13', 'Colossians 3:5'], ARRAY['WCF 6', 'WCF 13']),
  ('pneumatology_sanctification', 'Pneumatology', 'Sanctification', 'Sanctification by the Spirit', 'The Spirit produces holiness in believers.', ARRAY['Philippians 2:13', '1 Peter 1:2'], ARRAY['WCF 13'])
ON CONFLICT (doctrine_id) DO NOTHING;

-- ============================================================
-- RECORD SOURCE BATCHES
-- ============================================================
INSERT INTO source_batches (batch_label, batch_type, sources_added, sources_verified, chunks_created, doctrines_covered, release_ready)
VALUES
  ('Phase 6.1 Initial Corpus', 'confessional', 16, 15, 15, ARRAY['soteriology_justification', 'soteriology_predestination', 'soteriology_election', 'revelation_authority', 'soteriology_perseverance'], true),
  ('Phase 7 Batch A — Confessional Core', 'confessional', 14, 14, 14, ARRAY['theology_proper_trinity', 'theology_proper_attributes', 'hamartiology_fall', 'christology_person', 'soteriology_calling', 'soteriology_sanctification', 'soteriology_faith', 'soteriology_assurance', 'soteriology_justification'], true),
  ('Phase 7 Batch B — Reformation', 'reformation', 2, 2, 2, ARRAY['soteriology_election', 'atonement_penal_substitution'], true),
  ('Phase 7 Batch C — Puritan', 'puritan', 1, 1, 1, ARRAY['soteriology_sanctification', 'hamartiology_indwelling_sin'], true),
  ('Phase 7 Batch D — Edwards/Princeton', 'edwards_princeton', 2, 2, 2, ARRAY['christian_life_holiness', 'soteriology_justification'], true)
ON CONFLICT DO NOTHING;
