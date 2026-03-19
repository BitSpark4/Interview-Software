-- Phase 11 Task 2 — Additional syllabuses for all sectors
-- Run AFTER phase11_complete_sources.sql

INSERT INTO sector_syllabus
(sector, exam_name, official_url, syllabus_content, paper_structure, topic_weightage)
VALUES

-- MPSC MAHARASHTRA
('government', 'MPSC Maharashtra',
 'https://mpsc.gov.in',
 'Maharashtra History Culture Tradition. Maharashtra Geography Physical features rivers climate agriculture minerals. Maharashtra Polity Constitution State Legislature Panchayati Raj Municipal Corporations. Maharashtra Economy Agriculture industry services trade. Current Affairs Maharashtra national international. Marathi Language Grammar Literature. General Science Physics Chemistry Biology. General Knowledge India World.',
 'PRELIMS: 2 papers. GS Paper 100 questions 200 marks 2 hours. CSAT 100 questions 200 marks 2 hours. MAINS: 6 papers. Interview 100 marks.',
 '{"Maharashtra GK": "25%", "General Studies": "30%", "Current Affairs": "20%", "Marathi": "15%", "CSAT": "10%"}'
),

-- SSC CGL
('government', 'SSC CGL',
 'https://ssc.nic.in',
 'QUANTITATIVE APTITUDE: Number System Computation of Whole Numbers Decimals Fractions Percentage Ratio Proportion Square Roots Averages Interest Profit and Loss Discount Mixture Alligation Time Distance Work Partnership Data Interpretation. ENGLISH: Spot the Error Fill in the Blanks Synonyms Antonyms Spelling Detection Idioms Phrases One word Substitution Sentence Improvement. GENERAL INTELLIGENCE: Analogies Similarities Differences Space Visualization Problem Solving Analysis Judgment Decision Making Visual Memory Discriminating Observation. GENERAL AWARENESS: History Culture Geography Economic Scene General Polity Indian Constitution Scientific Research.',
 'TIER 1: 4 sections 100 questions 200 marks 60 minutes. Sectional timing 15 minutes each section. TIER 2: Paper 1 and 2 each 200 questions 200 marks. Negative marking 0.50 per wrong answer Tier 1. Negative marking 0.25 per wrong answer Tier 2.',
 '{"Quantitative": "25%", "English": "25%", "Reasoning": "25%", "General Awareness": "25%"}'
),

-- IBPS CLERK
('banking', 'IBPS Clerk',
 'https://ibps.in',
 'ENGLISH LANGUAGE: Reading Comprehension Cloze Test Para Jumbles Fill in Blanks Error Spotting Vocabulary. NUMERICAL ABILITY: Number Series Simplification Approximation Data Interpretation Quadratic Equations Arithmetic — SI CI Profit Loss TSD Work Time. REASONING ABILITY: Puzzles Seating Arrangement Syllogism Coding Decoding Blood Relations Direction Alphanumeric Series Inequalities.',
 'PRELIMS: 3 sections 100 questions 100 marks 1 hour. English 30 questions 20 marks 20 min. Numerical 35 questions 35 marks 20 min. Reasoning 35 questions 35 marks 20 min. MAINS: 5 sections 190 questions 200 marks 160 min.',
 '{"English": "20%", "Numerical": "35%", "Reasoning": "35%", "Computer": "5%", "General Banking": "5%"}'
),

-- MECHANICAL ENGINEERING CAMPUS
('engineering', 'Mechanical Engineering Campus',
 'https://gate2026.iitb.ac.in',
 'THERMODYNAMICS: First and Second Laws Carnot Cycle Rankine Cycle Otto Cycle Diesel Cycle Refrigeration Psychrometrics Heat Engines Efficiency. FLUID MECHANICS: Fluid Properties Statics Dynamics Bernoulli Equation Pipe Flow Boundary Layer Turbomachinery Compressors Turbines. STRENGTH OF MATERIALS: Stress Strain Elastic Constants Bending Shear Torsion Columns Beams Deflection Fatigue Fracture. MANUFACTURING: Casting Forging Rolling Extrusion Drawing Welding Machining Cutting Tools Metrology. THEORY OF MACHINES: Kinematics Dynamics Flywheel Governors Balancing Vibrations Gears Belts Chains. HEAT TRANSFER: Conduction Convection Radiation Heat Exchangers Boiling Condensation.',
 'Campus interviews: 2 rounds usually. Aptitude round 30 questions 30 minutes. Technical interview 45 to 60 minutes. HR interview 20 to 30 minutes. PSU written test 120 questions 2 hours.',
 '{"Thermodynamics": "20%", "Fluid Mechanics": "15%", "Strength of Materials": "15%", "Manufacturing": "20%", "Theory of Machines": "15%", "Heat Transfer": "15%"}'
),

-- CIVIL ENGINEERING
('engineering', 'Civil Engineering Campus',
 'https://gate2026.iitb.ac.in',
 'STRUCTURAL ENGINEERING: Mechanics of Structures RCC Design Steel Design Pre-stressed Concrete Structural Analysis Matrix Methods. GEOTECHNICAL: Soil Classification Permeability Consolidation Shear Strength Bearing Capacity Foundation Design Slope Stability. TRANSPORTATION: Highway Engineering Railways Traffic Engineering Airport Pavement Design. WATER RESOURCES: Fluid Mechanics Open Channel Groundwater Irrigation Hydrology Hydraulic Machines. ENVIRONMENTAL: Water Treatment Sewage Treatment Air Pollution Solid Waste Management.',
 'GATE 3 hours 100 marks. Campus interviews similar to mechanical. PSU interviews technical focused.',
 '{"Structural": "25%", "Geotechnical": "20%", "Transportation": "15%", "Water Resources": "25%", "Environmental": "15%"}'
),

-- ELECTRICAL ENGINEERING
('engineering', 'Electrical Engineering Campus',
 'https://gate2026.iitb.ac.in',
 'CIRCUITS: KVL KCL Network Theorems AC Circuits Resonance Two Port Networks. MACHINES: DC Machines Transformers Induction Motors Synchronous Machines Special Machines. POWER SYSTEMS: Transmission Distribution Protection Switchgear Power Electronics Drives. CONTROL SYSTEMS: Transfer Function Block Diagrams Signal Flow Graphs Stability Frequency Response. ELECTRONICS: Semiconductor Devices BJT FET Op-Amp Digital Electronics Microprocessors.',
 'GATE 3 hours 100 marks. Strong focus on power systems for BHEL NTPC PGCIL recruitment.',
 '{"Circuits": "15%", "Machines": "20%", "Power Systems": "25%", "Control": "20%", "Electronics": "20%"}'
),

-- NEET UG
('medical', 'NEET UG',
 'https://nta.ac.in/neet',
 'PHYSICS: Physical World Measurement Motion Laws Work Energy Gravitation Solid Fluid Thermal Heat Oscillations Waves Electrostatics Current Magnetism EMI AC EM Waves Optics Atoms Nuclei Semiconductors. CHEMISTRY: Basic Concepts Atomic Structure Bonding States of Matter Thermodynamics Equilibrium Redox Hydrogen s-block p-block d-block Coordination Organic Chemistry Polymers Biomolecules. BIOLOGY BOTANY: Cell Biology Genetics Ecology Plant Morphology Plant Physiology Reproduction. BIOLOGY ZOOLOGY: Animal Organization Structural Human Physiology Reproduction Evolution Health.',
 'Single paper 3 hours 20 minutes. 180 questions 720 marks. Physics 45 questions 180 marks. Chemistry 45 questions 180 marks. Biology 90 questions 360 marks. Correct 4 marks. Wrong minus 1.',
 '{"Biology": "50%", "Chemistry": "25%", "Physics": "25%"}'
),

-- NURSING
('medical', 'Nursing Entrance',
 'https://www.indiannursingcouncil.org',
 'ANATOMY AND PHYSIOLOGY: Body Systems Organs Functions Pathophysiology. FUNDAMENTALS OF NURSING: Nursing Process Assessment Planning Implementation Evaluation. MEDICAL SURGICAL NURSING: Common Diseases Medications Treatments Procedures. PEDIATRIC NURSING: Growth Development Child Diseases. OBSTETRIC NURSING: Antenatal Intrapartum Postnatal Newborn Care. COMMUNITY HEALTH: Epidemiology Family Health National Health Programs. MENTAL HEALTH NURSING: Psychiatric Disorders Medications Therapy.',
 'Entrance exam 100 questions 2 hours. Hospital interviews: Clinical knowledge plus communication skills plus practical demonstration.',
 '{"Anatomy": "15%", "Fundamentals": "20%", "Medical Surgical": "25%", "Community": "20%", "Other specialties": "20%"}'
),

-- JEE MAINS
('students', 'JEE Mains',
 'https://jeemain.nta.nic.in',
 'PHYSICS: Mechanics Heat Thermodynamics Waves Electricity Magnetism Optics Modern Physics. CHEMISTRY: Physical Chemistry — Mole Concept Equilibrium Electrochemistry Kinetics. Organic Chemistry — Nomenclature Reactions Mechanisms. Inorganic Chemistry — Periodic Table Bonding Coordination Compounds. MATHEMATICS: Sets Relations Complex Numbers Quadratic Permutation Binomial Sequence Series Limits Derivatives Integrals Differential Equations Matrices Vectors 3D Geometry Probability Statistics.',
 'Session 1 and 2 each year. 3 hours 300 marks. Physics 30 questions 100 marks. Chemistry 30 questions 100 marks. Mathematics 30 questions 100 marks. MCQ minus 1 for wrong. Numerical no negative.',
 '{"Mathematics": "33%", "Physics": "33%", "Chemistry": "34%"}'
),

-- TCS NQT CAMPUS PLACEMENT
('students', 'TCS NQT Campus Placement',
 'https://www.tcs.com/careers/india',
 'NUMERICAL ABILITY: Number System Profit Loss Percentages Ratios TSD Work Time Data Interpretation. VERBAL ABILITY: Reading Comprehension Grammar Fill in Blanks Sentence Completion Vocabulary. REASONING: Logical Reasoning Series Coding Decoding Analogies Syllogisms Blood Relations Directions. PROGRAMMING LOGIC: Basic programming concepts Pseudocode understanding Algorithmic thinking. ADVANCED TOPICS FOR DIGITAL ROLE: Data Structures Algorithms Coding in C Java Python SQL basics.',
 'Cognitive Skills test 90 minutes. Numerical 26 questions 40 minutes. Verbal 24 questions 30 minutes. Reasoning 30 questions 50 minutes. Qualifying cutoff approximately 60 percent. Technical interview after qualifying.',
 '{"Numerical": "30%", "Verbal": "25%", "Reasoning": "30%", "Programming": "15%"}'
);
