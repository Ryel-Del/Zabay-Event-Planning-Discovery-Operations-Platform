-- ========================================================
-- ZABAY SEED DATA: VERIFIED BOHOL VENUES & HALLS
-- ========================================================

-- Insert Initial Users
INSERT INTO users (id, name, email, role, phone, organization, location, bio)
VALUES 
  ('usr-org-1', 'Mark Bautista', 'mark.bautista@zabay.ph', 'organizer', '+63 (917) 555-0192', 'Bohol Youth Leadership Council', 'Tagbilaran City', 'Lead event director specialized in university conferences and athletics.'),
  ('usr-vm-1', 'Maria Elena Santos', 'elena.santos@boholculturalcenter.ph', 'venue_manager', '+63 (38) 411-3520', 'Bohol Cultural Center', 'Cogon District, Tagbilaran', 'Venue director overseeing plenary stages, acoustic rigging, and logistics.'),
  ('usr-stf-1', 'Carlos Mendoza', 'carlos.mendoza@crew.zabay.ph', 'staff', '+63 (920) 441-8899', 'Zabay Stage Crew & AV Ops', 'Downtown District, Tagbilaran', 'Stage manager handling audio console, referee sync, and VIP ingress.'),
  ('usr-att-1', 'Sofia Ramos', 'sofia.ramos@bisu.edu.ph', 'attendee', '+63 (918) 772-3341', 'Bohol Island State University', 'Dampas, Tagbilaran', 'Student delegate and tech enthusiast attending local seminars.')
ON CONFLICT (id) DO NOTHING;

-- Insert Venues with Accurate Bohol GPS Coordinates
INSERT INTO venues (id, name, city, address, lat, lng, capacity, hourly_rate, facilities, power_kw_capacity, is_indoor, manager_id, contact_email, contact_phone)
VALUES
  ('ven-1', 'Bohol Cultural Center', 'Tagbilaran City', 'J.A. Clarin St, Cogon District, Tagbilaran City, Bohol', 9.64819, 123.85582, 2200, 3500.00, ARRAY['Dedicated Gigabit Fiber WiFi', '4K Laser Projection System', 'Dual Keynote Stages', 'Backstage VIP Green Rooms', 'Surround Line-Array Sound', 'Heavy Loading Dock & Staging Bay', 'Commercial Prep Kitchen', 'Wheelchair & ADA Accessible'], 450, true, 'usr-vm-1', 'events@boholculturalcenter.ph', '+63 (38) 411-3520'),
  ('ven-2', 'Holy Name University (HNU) Barder Gymnasium', 'Tagbilaran City', 'Janssen Heights, Dampas District, Tagbilaran City, Bohol', 9.65040, 123.86790, 3500, 2800.00, ARRAY['Indoor Arena Hardwood Court', 'Dedicated Gigabit Fiber WiFi', 'Modular Breakout Workshop Rooms', 'Livestream Broadcast Booth', 'Bleacher Seating System', 'Electronic Digital Scoreboards', 'Wheelchair & ADA Accessible'], 380, true, 'usr-vm-1', 'gym@hnu.edu.ph', '+63 (38) 411-2244'),
  ('ven-3', 'Bohol Wisdom School Gymnasium', 'Tagbilaran City', 'CPG North Avenue, Cogon District, Tagbilaran City, Bohol', 9.66060, 123.85610, 2000, 2200.00, ARRAY['Indoor Arena Hardwood Court', 'Dedicated Gigabit Fiber WiFi', 'Permanent Elevated Stage', 'Bleacher Seating System', 'Stage Lighting Rigging', 'Wheelchair & ADA Accessible'], 250, true, 'usr-vm-1', 'gymnasium@boholwisdom.edu.ph', '+63 (38) 412-3456'),
  ('ven-4', 'The MetroCentre Hotel & Convention Center', 'Tagbilaran City', 'CPG Avenue, Downtown District, Tagbilaran City, Bohol', 9.64423, 123.85551, 850, 4800.00, ARRAY['Grand Ballroom Crystal Chandeliers', 'Dedicated Gigabit Fiber WiFi', '4K LED Wall & Displays', 'Executive Conference Rooms', 'Commercial Prep Kitchen', 'Audio & Mic Console', 'Wheelchair & ADA Accessible'], 320, true, 'usr-vm-1', 'banquets@metrocentrehotel.com', '+63 (38) 411-2599'),
  ('ven-5', 'Fortridge Pavilion & Mountain Resort', 'Dauis', 'Upper Songculan, Dauis, Panglao Island, Bohol', 9.63037, 123.84285, 650, 3200.00, ARRAY['Open-Air Panoramic Bayview Deck', 'Acoustic Sound Treatment', 'Perimeter Security Fencing', 'Garden Banquet Staging Bay', 'Dedicated Gigabit Fiber WiFi', 'Standby Generator Backup'], 220, false, 'usr-vm-1', 'events@fortridgepavilion.com', '+63 (38) 502-8822'),
  ('ven-6', 'Bohol Tropics Resort and Convention Center', 'Tagbilaran City', 'Graham Avenue, Tagbilaran City, Bohol', 9.65387, 123.84915, 2200, 4500.00, ARRAY['Multi-Tier Convention Stage', 'Dedicated Gigabit Fiber WiFi', 'Surround Line-Array Sound', 'Commercial Prep Kitchen', 'VIP Green Rooms & Holding Suites', 'Heavy Loading Dock & Staging Bay', 'Wheelchair & ADA Accessible', '4K Laser Projection System', 'Oceanfront Sea-Breeze Pavilion'], 450, true, 'usr-vm-1', 'conventions@boholtropics.com', '+63 (38) 411-3510'),
  ('ven-8', 'Plaza Rizal & Garcia Heritage Park Open Amphitheater', 'Tagbilaran City', 'CPG Avenue corner Torralba St, Tagbilaran City, Bohol', 9.64040, 123.85610, 1600, 850.00, ARRAY['Public Civic Stage & Bandstand', 'Heritage Park Open Grounds', 'Perimeter Security Fencing', 'Solar & Municipal Power Hookups', 'Wheelchair & ADA Accessible'], 150, false, 'usr-vm-1', 'cityparks@tagbilaran.gov.ph', '+63 (38) 411-3700'),
  ('ven-9', 'National Museum of the Philippines – Bohol', 'Tagbilaran City', 'Old Provincial Capitol Heritage Building, CPG Avenue, Tagbilaran City, Bohol', 9.64020, 123.85650, 350, 1800.00, ARRAY['Historic Courtyard & Quadrangle', 'Audiovisual Lecture Hall', 'Dedicated Gigabit Fiber WiFi', 'Curated Exhibit Galleries', 'Wheelchair & ADA Accessible', 'Acoustic Sound Treatment'], 160, true, 'usr-vm-1', 'bohol@nationalmuseum.gov.ph', '+63 (38) 411-4040'),
  ('ven-10', 'Just Sizzlin’ Bohol – Function & Conference Suites', 'Tagbilaran City', 'CPG North Avenue, Cogon District, Tagbilaran City, Bohol', 9.65850, 123.85690, 120, 1200.00, ARRAY['Private Executive Conference Rooms', 'Dedicated Gigabit Fiber WiFi', 'Smart TV & Presentation Display', 'In-House Dining & Catering', 'Modular Breakout Workshop Rooms', 'Airconditioned Comfort'], 80, true, 'usr-vm-1', 'functions@justsizzlinbohol.ph', '+63 (38) 412-5888')
ON CONFLICT (id) DO NOTHING;

-- Insert Distinct Function Halls for Multi-Hall Venues
INSERT INTO venue_halls (id, venue_id, name, capacity, hourly_rate, is_indoor, dimensions, facilities, description)
VALUES
  -- Bohol Tropics Resort Halls
  ('vh-trop-dagohoy', 'ven-6', 'Dagohoy Grand Hall', 2000, 4500.00, true, '38m x 25m (950 sqm) 2-Story', ARRAY['Multi-Tier Stage', 'Dedicated Line-Array Audio', 'VIP Holding Suites', 'Loading Dock', '4K Projection'], 'Premier two-story convention auditorium accommodating large congresses and national summits with mezzanine balcony.'),
  ('vh-trop-sandugo', 'ven-6', 'Sandugo Grand Ballroom', 1200, 3800.00, true, '30m x 22m (660 sqm)', ARRAY['Crystal Chandeliers', 'High-Ceiling Rigging', 'Acoustic Paneling', 'Prep Kitchen'], 'Grand indoor ballroom tailored for academic galas and major celebrations.'),
  ('vh-trop-harbor', 'ven-6', 'Harbor View Function Hall', 250, 2200.00, true, '18m x 12m (216 sqm)', ARRAY['Harbor Ocean Vista Windows', 'Integrated PA & Mics', 'Buffet Staging Bay', 'Fiber WiFi'], 'Waterfront hall featuring wall-to-wall glass windows overlooking Tagbilaran harbor.'),
  ('vh-trop-sikatuna', 'ven-6', 'Sikatuna Executive Suite & Breakouts', 100, 1200.00, true, '12m x 10m (120 sqm)', ARRAY['Executive Smart Displays', 'High-Speed WiFi', 'Modular Seminar Tables', 'Airconditioned'], 'Dedicated corporate suite for breakout sessions and executive seminars.'),
  ('vh-trop-bayview', 'ven-6', 'Fisherman''s Wharf & Bayview Deck', 800, 2800.00, false, '35m x 20m (700 sqm)', ARRAY['Open-Air Oceanfront Bayview', 'Concert Stage Rigging', 'Sunset Ambient Lighting', 'Outdoor Power Feeds'], 'Iconic open-air waterfront deck directly above the bay for festivals and sunset networking.'),

  -- MetroCentre Hotel Halls
  ('vh-metro-grand', 'ven-4', 'Grand Ballroom (Combined Wings A & B)', 650, 4800.00, true, '19.9m x 24.4m (485 sqm)', ARRAY['Crystal Chandeliers', '4K LED Video Wall', 'Dedicated Gigabit Fiber WiFi', 'Line-Array Audio'], 'Premier grand ballroom with 5-meter ceilings, crystal chandeliers, and full 4K LED backdrop.'),
  ('vh-metro-b', 'ven-4', 'Ballroom B (Main Section)', 400, 3200.00, true, '19.9m x 14.9m (266 sqm)', ARRAY['4K LED Display', 'Dedicated Gigabit Fiber WiFi', 'Audio Desk', 'Airconditioned'], 'The largest single divisible hall section with 266 sqm of plenary space.'),
  ('vh-metro-a', 'ven-4', 'Ballroom A (East Wing)', 210, 2200.00, true, '19.9m x 9.5m (177 sqm)', ARRAY['HD Projection', 'Wireless Microphones', 'Airconditioned', 'Fiber WiFi'], 'East wing ballroom space suited for break-out plenaries and medium workshops.'),
  ('vh-metro-ruby', 'ven-4', 'Ruby Conference Hall', 170, 1800.00, true, '21.7m x 11.8m (158 sqm)', ARRAY['Acoustic Treatment', 'Classroom Seating', 'Podium & Lapel Mics', 'Fiber WiFi'], 'Dedicated corporate conference hall with customized classroom setup.'),
  ('vh-metro-c', 'ven-4', 'Ballroom C / Sapphire Breakout Suite', 100, 1400.00, true, '9.1m x 14.9m (134 sqm)', ARRAY['Whiteboards', 'Modular Seminar Tables', 'High-Speed WiFi', 'Smart Displays'], 'Modular meeting room designed for committee roundtables and board sessions.'),

  -- Bohol Cultural Center Halls
  ('vh-bcc-1', 'ven-1', 'Plenary Hall & Main Auditorium', 2200, 3500.00, true, '32m x 26m (832 sqm)', ARRAY['Dual Keynote Stages', 'Surround Line-Array Sound', '4K Laser Projection', 'VIP Green Rooms'], 'Two-tier plenary hall with permanent acoustic theater stage.'),
  ('vh-bcc-2', 'ven-1', 'Exhibition & Foyer Cultural Gallery', 400, 1500.00, true, '22m x 14m (308 sqm)', ARRAY['Gallery Track Lighting', 'Fiber WiFi', 'Modular Display Panels', 'Buffet Staging'], 'Spacious high-ceiling foyer and exhibition gallery.'),

  -- HNU Barder Gym Halls
  ('vh-hnu-1', 'ven-2', 'Main Arena Hardwood Court', 3500, 2800.00, true, '40m x 28m (1,120 sqm)', ARRAY['Hardwood Court', 'Bleacher Seating', 'Digital Scoreboard', 'Broadcast Booth'], 'FIBA-regulation hardwood sports arena with high-capacity bleachers.'),
  ('vh-hnu-2', 'ven-2', 'Multipurpose Mezzanine & Activity Hall', 400, 1200.00, true, '20m x 15m (300 sqm)', ARRAY['Mirror Studio Wall', 'PA System', 'Fiber WiFi', 'Airconditioned'], 'Upper mezzanine multipurpose space for athletic workshops.')
ON CONFLICT (id) DO NOTHING;
