-- Phase 9 Seed — Complete syllabus data for all sectors
-- Run AFTER phase9_research_tables.sql

INSERT INTO sector_syllabus
(sector, exam_name, official_url, syllabus_content, paper_structure, topic_weightage)
VALUES

-- UPSC CIVIL SERVICES
('government', 'UPSC Civil Services',
 'https://upsc.gov.in/examinations/syllabus',
 'PRELIMS GS PAPER 1: Current events of national and international importance. History of India and Indian National Movement. Indian and World Geography — Physical Social Economic Geography of India and the World. Indian Polity and Governance — Constitution Political System Panchayati Raj Public Policy Rights Issues. Economic and Social Development — Sustainable Development Poverty Inclusion Demographics Social Sector Initiatives. General issues on Environmental Ecology Biodiversity and Climate Change. General Science.

PRELIMS CSAT PAPER 2: Comprehension. Interpersonal skills including communication skills. Logical reasoning and analytical ability. Decision making and problem solving. General mental ability. Basic numeracy — numbers and their relations orders of magnitude — Class X level. Data interpretation — charts graphs tables — Class X level. English Language Comprehension skills — Class X level.

MAINS GS PAPER 1: Indian Heritage and Culture History and Geography of the World and Society.
MAINS GS PAPER 2: Governance Constitution Polity Social Justice and International Relations.
MAINS GS PAPER 3: Technology Economic Development Bio diversity Environment Security and Disaster Management.
MAINS GS PAPER 4: Ethics Integrity and Aptitude.',

 'PRELIMS: 2 papers. GS Paper 1 — 100 questions 200 marks 2 hours. CSAT Paper 2 — 80 questions 200 marks 2 hours. Negative marking 1/3. CSAT is qualifying only need 33 percent. MAINS: 9 papers. Essay 250 marks. GS 1 to 4 each 250 marks. Optional paper 1 and 2 each 250 marks. Language papers qualifying. Interview 275 marks. Total 2025 marks.',

 '{"History": "15%", "Geography": "15%", "Polity": "20%", "Economy": "15%", "Environment": "10%", "Science": "10%", "Current Affairs": "15%"}'
),

-- IBPS PO
('banking', 'IBPS PO',
 'https://ibps.in',
 'PRELIMS: English Language — Reading comprehension Cloze test Para jumbles Miscellaneous Error spotting Fill in the blanks. Quantitative Aptitude — Simplification Profit and Loss Mixtures and Allegations Simple Interest Compound Interest Surds and Indices Work and Time Time and Distance Mensuration Data Interpretation. Reasoning Ability — Logical Reasoning Alphanumeric Series Ranking Direction Alphabet Test Data Sufficiency Coded Inequalities Seating Arrangement Puzzle Tabulation Syllogism Blood Relations Input Output Coding Decoding.

MAINS: Reasoning and Computer Aptitude — Internet Memory Keyboard Shortcuts Computer Abbreviation Microsoft Office Computer Hardware Software Operating System Networking. English Language — Reading Comprehension Grammar Vocabulary. Data Analysis and Interpretation — Tabular Graph Bar Graph Pie Chart Line Chart. General Economy Banking Awareness — Financial Awareness Current Affairs General Knowledge.',

 'PRELIMS: 3 sections 100 questions 100 marks 1 hour. English 30 questions 20 minutes. Quantitative 35 questions 20 minutes. Reasoning 35 questions 20 minutes. Sectional cutoff applies. MAINS: 4 sections 155 questions 200 marks 3 hours. Descriptive test 25 marks 30 minutes. Interview 100 marks. Final merit based on mains plus interview.',

 '{"English": "25%", "Quantitative": "25%", "Reasoning": "25%", "Banking Awareness": "25%"}'
),

-- GATE MECHANICAL
('engineering', 'GATE Mechanical',
 'https://gate2025.iitr.ac.in',
 'ENGINEERING MATHEMATICS: Linear Algebra Calculus Differential Equations Complex Variables Probability and Statistics Numerical Methods. APPLIED MECHANICS AND DESIGN: Engineering Mechanics Mechanics of Materials Theory of Machines Vibrations Machine Design. FLUID MECHANICS AND THERMAL SCIENCES: Fluid Mechanics Heat Transfer Thermodynamics Applications. MATERIALS MANUFACTURING AND INDUSTRIAL ENGINEERING: Engineering Materials Casting Forming and Joining Processes Machining and Machine Tool Operations Metrology and Inspection Computer Integrated Manufacturing Production Planning and Control Inventory Control Operations Research.',

 'Single paper 3 hours 100 marks. General Aptitude 15 marks 10 questions. Core subject 85 marks 55 questions. MCQ type 1 mark and 2 mark questions. MSQ multiple select questions. NAT numerical answer type. Negative marking for MCQ only.',

 '{"Engineering Mathematics": "13%", "Applied Mechanics": "22%", "Fluid Thermal": "27%", "Manufacturing": "23%", "General Aptitude": "15%"}'
),

-- NEET PG
('medical', 'NEET PG',
 'https://natboard.edu.in',
 'All subjects from MBBS curriculum. Medicine — General Medicine Cardiology Respiratory Gastroenterology Nephrology Neurology Endocrinology Hematology Rheumatology Dermatology. Surgery — General Surgery Orthopedics Urology Neurosurgery Plastic Surgery Cardiothoracic. Obstetrics and Gynecology — Obstetrics Gynecology Family Planning Reproductive Medicine. Pediatrics — General Pediatrics Neonatology Pediatric Surgery. Psychiatry. ENT. Ophthalmology. Radiology. Anesthesia. Community Medicine — Preventive and Social Medicine Epidemiology Biostatistics.',

 'Single paper 3 hours 30 minutes. 200 MCQ questions. 4 marks for correct answer. 1 mark deducted for wrong answer. No deduction for unattempted. Total 800 marks. Computer based test.',

 '{"Medicine": "20%", "Surgery": "15%", "OBG": "12%", "Pediatrics": "10%", "Psychiatry": "8%", "Orthopedics": "8%", "ENT": "6%", "Ophthalmology": "6%", "Radiology": "5%", "Others": "10%"}'
),

-- CET MAHARASHTRA
('students', 'CET Maharashtra',
 'https://cetcell.mahacet.org',
 'PHYSICS: Measurements Scalars and Vectors Projectile Motion Laws of Motion Gravitation Mechanical Properties of Solids and Fluids Thermal Properties of Matter Thermodynamics Kinetic Theory of Gases Oscillations Waves Electrostatics Current Electricity Magnetic Effects of Electric Current Magnetism Electromagnetic Induction Alternating Current Electromagnetic Waves Ray Optics Wave Optics Dual Nature of Matter Atoms Nuclei Semiconductor Devices Communication Systems. CHEMISTRY: Basic Concepts Atomic Structure Chemical Bonding States of Matter Thermodynamics Chemical Equilibrium Redox Reactions Electrochemistry Chemical Kinetics Surface Chemistry General Principles of Metallurgy Hydrogen s-block elements p-block elements d and f block elements Coordination Compounds Organic Chemistry Polymers Biomolecules Environmental Chemistry Chemistry in everyday life. MATHEMATICS: Trigonometry Logarithms Complex Numbers Permutations and Combinations Mathematical Induction Sets Relations and Functions Sequences and Series Straight Lines Circles Conics Vectors Three Dimensional Geometry Matrices Determinants Limits Derivatives Integrals Differential Equations Probability Statistics Linear Programming.',

 'Single paper 3 hours. Physics 50 questions 50 marks. Chemistry 50 questions 50 marks. Mathematics 50 questions 50 marks. Total 150 questions 150 marks. No negative marking. Marks are basis for admission to engineering colleges in Maharashtra.',

 '{"Physics": "33%", "Chemistry": "33%", "Mathematics": "34%"}'
),

-- CAT EXAM
('business', 'CAT',
 'https://iimcat.ac.in',
 'VERBAL ABILITY AND READING COMPREHENSION: Reading Comprehension — 3 to 4 passages with questions. Verbal Ability — Para jumbles Para summary Odd sentence out Sentence completion. Grammar and Usage. DATA INTERPRETATION AND LOGICAL REASONING: Data Interpretation — Tables Bar graphs Line charts Pie charts Caselets. Logical Reasoning — Seating arrangements Puzzles Blood relations Directions Syllogisms. QUANTITATIVE ABILITY: Arithmetic — Percentages Ratios Profit Loss TSD Time Work. Algebra — Equations Inequalities Functions. Geometry — Triangles Circles Mensuration. Number System. Modern Math — Permutations Combinations Probability Progressions.',

 '2 hours total. 3 sections 40 minutes each. VARC 24 questions. DILR 20 questions. QA 22 questions. Total 66 questions. MCQ and TITA type. Negative marking minus 1 for wrong MCQ. No negative for TITA. Scaled score reported out of 300.',

 '{"VARC": "34%", "DILR": "32%", "QA": "34%"}'
);
