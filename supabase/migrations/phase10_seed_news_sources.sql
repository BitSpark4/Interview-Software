-- Phase 10 Task 2 — Trusted news sources
-- Run AFTER phase10_asked_questions.sql

INSERT INTO official_sources
(sector, exam_name, source_type, url, description)
VALUES

-- PRIMARY TRUSTED SOURCE
('all', 'Current Affairs',
 'official_website',
 'https://www.thehindu.com',
 'The Hindu — most trusted for UPSC preparation'),

-- GOVERNMENT AND POLICY
('government', 'Current Affairs',
 'official_website',
 'https://pib.gov.in/newsite/erelease.aspx',
 'Press Information Bureau — official government news'),

('government', 'Current Affairs',
 'official_website',
 'https://www.india.gov.in/news',
 'Official India government portal news'),

-- BANKING AND ECONOMY
('banking', 'Current Affairs',
 'official_website',
 'https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
 'RBI official press releases'),

('banking', 'Current Affairs',
 'official_website',
 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=3&smid=0',
 'SEBI latest orders and circulars'),

-- INTERNATIONAL NEWS
('all', 'International Affairs',
 'official_website',
 'https://www.bbc.com/news/world/asia/india',
 'BBC India — international perspective'),

('all', 'International Affairs',
 'official_website',
 'https://timesofindia.indiatimes.com',
 'Times of India — national coverage'),

-- SCIENCE AND TECHNOLOGY
('all', 'Science Technology',
 'official_website',
 'https://www.isro.gov.in/PressRelease.html',
 'ISRO press releases for science questions'),

-- SUPREME COURT
('government', 'Legal Current Affairs',
 'official_website',
 'https://main.sci.gov.in/judgements',
 'Supreme Court of India judgments'),

-- MAHARASHTRA SPECIFIC
('government', 'Maharashtra Affairs',
 'official_website',
 'https://maharashtra.gov.in',
 'Maharashtra government official portal'),

-- HISTORY REFERENCE
('all', 'History Reference',
 'official_website',
 'https://ncert.nic.in/textbook.php',
 'NCERT textbooks — standard reference for all exams'),

-- ECONOMICS
('banking', 'Economics Reference',
 'official_website',
 'https://mospi.gov.in',
 'Ministry of Statistics — official economic data'),

('banking', 'Economics Reference',
 'official_website',
 'https://finmin.nic.in/economic-survey',
 'Economic Survey of India annual report');
