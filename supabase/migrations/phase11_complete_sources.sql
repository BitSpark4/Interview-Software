-- Phase 11 Task 1 — Complete official sources for all sectors
-- Run this in Supabase SQL editor

-- Clear existing sources first
DELETE FROM official_sources;

INSERT INTO official_sources
(sector, exam_name, source_type, url, description)
VALUES

-- SECTOR 1: GOVERNMENT JOBS
('government', 'UPSC Civil Services', 'official_website', 'https://upsc.gov.in', 'UPSC official — check every 14 days'),
('government', 'UPSC Syllabus', 'syllabus_pdf', 'https://upsc.gov.in/examinations/syllabus', 'Official UPSC syllabus page'),
('government', 'MPSC Maharashtra', 'official_website', 'https://mpsc.gov.in', 'MPSC official — check every 14 days'),
('government', 'SSC Exams', 'official_website', 'https://ssc.nic.in', 'SSC official — check every 14 days'),
('government', 'Railway RRB', 'official_website', 'https://indianrailways.gov.in', 'Railway recruitment — check every 14 days'),
('government', 'Defence Recruitment', 'official_website', 'https://joinindianarmy.nic.in', 'Army recruitment — check every 30 days'),
('government', 'Teaching TET CTET', 'official_website', 'https://ctet.nic.in', 'CTET official — check every 30 days'),
('government', 'Government Schemes', 'official_website', 'https://pib.gov.in', 'PIB — check every 7 days for schemes'),
('government', 'Supreme Court', 'official_website', 'https://main.sci.gov.in/judgements', 'SC judgments — check every 7 days'),
('government', 'Maharashtra Government', 'official_website', 'https://maharashtra.gov.in', 'Maharashtra schemes — check every 7 days'),

-- SECTOR 2: BANKING AND FINANCE
('banking', 'IBPS All Exams', 'official_website', 'https://ibps.in', 'IBPS official — check every 14 days'),
('banking', 'SBI Recruitment', 'official_website', 'https://sbi.co.in/careers', 'SBI careers — check every 14 days'),
('banking', 'RBI Recruitment', 'official_website', 'https://rbi.org.in/careers', 'RBI careers — check every 14 days'),
('banking', 'RBI Monetary Policy', 'official_website', 'https://rbi.org.in/scripts/monetarypolicy.aspx', 'RBI policy — check every 7 days'),
('banking', 'RBI Press Releases', 'official_website', 'https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx', 'RBI news — check every 7 days'),
('banking', 'SEBI Regulations', 'official_website', 'https://sebi.gov.in', 'SEBI circulars — check every 7 days'),
('banking', 'LIC Recruitment', 'official_website', 'https://licindia.in/careers', 'LIC official — check every 14 days'),
('banking', 'NABARD Recruitment', 'official_website', 'https://nabard.org/careers', 'NABARD official — check every 30 days'),
('banking', 'Economic Survey', 'official_website', 'https://finmin.nic.in/economic-survey', 'Annual economic data — check every year'),
('banking', 'Ministry Statistics', 'official_website', 'https://mospi.gov.in', 'GDP inflation data — check every month'),

-- SECTOR 3: ENGINEERING
('engineering', 'GATE Official', 'official_website', 'https://gate2026.iitb.ac.in', 'GATE official — check every 30 days'),
('engineering', 'BHEL Recruitment', 'official_website', 'https://bhel.com/careers', 'BHEL PSU — check every 30 days'),
('engineering', 'ONGC Recruitment', 'official_website', 'https://ongcindia.com/careers', 'ONGC PSU — check every 30 days'),
('engineering', 'NTPC Recruitment', 'official_website', 'https://ntpc.co.in/careers', 'NTPC PSU — check every 30 days'),
('engineering', 'ISRO Recruitment', 'official_website', 'https://isro.gov.in/careers', 'ISRO scientist posts — check every 30 days'),
('engineering', 'DRDO Recruitment', 'official_website', 'https://drdo.gov.in/careers', 'DRDO scientist posts — check every 30 days'),
('engineering', 'L&T Careers', 'official_website', 'https://careers.larsentoubro.com', 'L&T private sector — check every 30 days'),
('engineering', 'Tata Group Careers', 'official_website', 'https://www.tata.com/careers', 'Tata Group — check every 30 days'),

-- SECTOR 4: MEDICAL AND HEALTHCARE
('medical', 'NEET PG Official', 'official_website', 'https://natboard.edu.in', 'NBE official — check every 30 days'),
('medical', 'NEET UG Official', 'official_website', 'https://nta.ac.in/neet', 'NTA NEET — check every 30 days'),
('medical', 'NMC Guidelines', 'official_website', 'https://nmc.org.in', 'National Medical Commission — check every 30 days'),
('medical', 'AIIMS Recruitment', 'official_website', 'https://aiims.edu/en/careers.html', 'AIIMS jobs — check every 30 days'),
('medical', 'WHO India', 'official_website', 'https://www.who.int/india', 'WHO guidelines — check every 14 days'),
('medical', 'Ministry of Health', 'official_website', 'https://mohfw.gov.in', 'Health ministry schemes — check every 14 days'),
('medical', 'Indian Nursing Council', 'official_website', 'https://www.indiannursingcouncil.org', 'Nursing regulations — check every 30 days'),

-- SECTOR 5: STUDENTS AND FRESHERS
('students', 'CET Maharashtra', 'official_website', 'https://cetcell.mahacet.org', 'MH-CET official — check every 14 days'),
('students', 'JEE Mains Official', 'official_website', 'https://jeemain.nta.nic.in', 'JEE Mains NTA — check every 14 days'),
('students', 'JEE Advanced', 'official_website', 'https://jeeadv.ac.in', 'JEE Advanced — check every 14 days'),
('students', 'NCERT Textbooks', 'official_website', 'https://ncert.nic.in/textbook.php', 'NCERT — standard reference all exams'),
('students', 'UGC NET', 'official_website', 'https://ugcnet.nta.nic.in', 'UGC NET for teaching — check every 30 days'),
('students', 'Campus Placement TCS', 'official_website', 'https://www.tcs.com/careers/india', 'TCS NQT pattern — check every 30 days'),
('students', 'Campus Placement Infosys', 'official_website', 'https://career.infosys.com', 'Infosys placement — check every 30 days'),
('students', 'Campus Placement Wipro', 'official_website', 'https://careers.wipro.com', 'Wipro placement — check every 30 days'),

-- SECTOR 6: BUSINESS AND MBA
('business', 'CAT Official', 'official_website', 'https://iimcat.ac.in', 'CAT IIM official — check every 30 days'),
('business', 'XAT Official', 'official_website', 'https://xatonline.in', 'XAT XLRI — check every 30 days'),
('business', 'SNAP Official', 'official_website', 'https://www.snaptest.org', 'SNAP Symbiosis — check every 30 days'),
('business', 'MAT Official', 'official_website', 'https://mat.aima.in', 'MAT AIMA — check every 30 days'),
('business', 'IIM Ahmedabad', 'official_website', 'https://www.iima.ac.in/admissions', 'IIM A admission process — check every 30 days'),
('business', 'Economic Times', 'official_website', 'https://economictimes.indiatimes.com', 'Business news India — check every 7 days'),

-- SECTOR 7: IT AND TECH
('it_tech', 'TCS Digital', 'official_website', 'https://www.tcs.com/careers/india', 'TCS hiring pattern — check every 30 days'),
('it_tech', 'Infosys Careers', 'official_website', 'https://career.infosys.com', 'Infosys pattern — check every 30 days'),
('it_tech', 'Amazon India', 'official_website', 'https://amazon.jobs/en/locations/india', 'Amazon hiring — check every 30 days'),
('it_tech', 'Google India', 'official_website', 'https://careers.google.com/locations/india', 'Google hiring — check every 30 days'),

-- ALL SECTORS: CURRENT AFFAIRS
('all', 'The Hindu', 'official_website', 'https://www.thehindu.com', 'PRIMARY SOURCE — check every day'),
('all', 'PIB India', 'official_website', 'https://pib.gov.in', 'Government press releases — check every day'),
('all', 'BBC India', 'official_website', 'https://www.bbc.com/news/world/asia/india', 'International view — check every day'),
('all', 'Times of India', 'official_website', 'https://timesofindia.indiatimes.com', 'National news — check every day'),
('all', 'ISRO News', 'official_website', 'https://www.isro.gov.in/PressRelease.html', 'Science technology news — check every 7 days'),
('all', 'India Budget', 'official_website', 'https://www.indiabudget.gov.in', 'Union Budget annual — check every year'),
('all', 'NCERT History Class 6', 'official_website', 'https://ncert.nic.in/textbook.php?fhss1=0-7', 'Ancient history reference'),
('all', 'NCERT History Class 12', 'official_website', 'https://ncert.nic.in/textbook.php?lhst1=0-10', 'Modern history reference');
