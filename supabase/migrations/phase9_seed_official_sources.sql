-- Phase 9 Seed — Official source URLs for all sectors
-- Run AFTER phase9_research_tables.sql

INSERT INTO official_sources
(sector, exam_name, source_type, url, description)
VALUES

-- GOVERNMENT SECTOR
('government', 'UPSC Civil Services',
 'official_website',
 'https://upsc.gov.in',
 'Main UPSC website for notifications'),

('government', 'UPSC Civil Services',
 'syllabus_pdf',
 'https://upsc.gov.in/examinations/syllabus',
 'Official UPSC syllabus page'),

('government', 'MPSC Maharashtra',
 'official_website',
 'https://mpsc.gov.in',
 'Maharashtra Public Service Commission'),

('government', 'SSC CGL',
 'official_website',
 'https://ssc.nic.in',
 'Staff Selection Commission'),

('government', 'Railway RRB',
 'official_website',
 'https://indianrailways.gov.in',
 'Indian Railways recruitment'),

('government', 'Defence NDA CDS',
 'official_website',
 'https://joinindianarmy.nic.in',
 'Indian Army recruitment'),

-- BANKING SECTOR
('banking', 'IBPS PO Clerk',
 'official_website',
 'https://ibps.in',
 'Institute of Banking Personnel Selection'),

('banking', 'SBI PO Clerk',
 'official_website',
 'https://sbi.co.in/careers',
 'SBI official careers page'),

('banking', 'RBI Grade B',
 'official_website',
 'https://rbi.org.in/careers',
 'Reserve Bank of India careers'),

('banking', 'RBI Monetary Policy',
 'official_website',
 'https://rbi.org.in/scripts/monetarypolicy.aspx',
 'RBI monetary policy updates'),

('banking', 'Insurance LIC',
 'official_website',
 'https://licindia.in/careers',
 'LIC careers portal'),

-- ENGINEERING SECTOR
('engineering', 'GATE Examination',
 'official_website',
 'https://gate2025.iitr.ac.in',
 'GATE official website'),

('engineering', 'BHEL PSU',
 'official_website',
 'https://bhel.com/careers',
 'BHEL recruitment portal'),

('engineering', 'ONGC PSU',
 'official_website',
 'https://ongcindia.com/careers',
 'ONGC recruitment portal'),

('engineering', 'NTPC PSU',
 'official_website',
 'https://ntpc.co.in/careers',
 'NTPC recruitment portal'),

-- MEDICAL SECTOR
('medical', 'NEET PG',
 'official_website',
 'https://natboard.edu.in',
 'National Board of Examinations'),

('medical', 'NEET UG',
 'official_website',
 'https://nta.ac.in/neet',
 'NTA NEET official website'),

('medical', 'Medical Council',
 'official_website',
 'https://nmc.org.in',
 'National Medical Commission'),

-- STUDENTS SECTOR
('students', 'CET Maharashtra',
 'official_website',
 'https://cetcell.mahacet.org',
 'Maharashtra CET Cell'),

('students', 'JEE Mains',
 'official_website',
 'https://jeemain.nta.nic.in',
 'JEE Mains NTA official'),

('students', 'JEE Advanced',
 'official_website',
 'https://jeeadv.ac.in',
 'JEE Advanced official'),

-- BUSINESS SECTOR
('business', 'CAT Exam',
 'official_website',
 'https://iimcat.ac.in',
 'CAT official IIM website'),

('business', 'XAT Exam',
 'official_website',
 'https://xatonline.in',
 'XAT official website'),

-- CURRENT AFFAIRS SOURCES
('government', 'Daily Current Affairs',
 'official_website',
 'https://pib.gov.in',
 'Press Information Bureau India'),

('banking', 'RBI Weekly Updates',
 'official_website',
 'https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
 'RBI press releases'),

('government', 'Ministry Finance',
 'official_website',
 'https://finmin.nic.in',
 'Ministry of Finance India');
