export const UPDATE_SCHEDULE = {

  government: {
    frequency: '14 days',
    priority: 'HIGH',
    sources: [
      { name: 'UPSC Official', url: 'https://upsc.gov.in', checkFor: 'New notifications exam dates syllabus changes' },
      { name: 'MPSC Official', url: 'https://mpsc.gov.in', checkFor: 'Maharashtra PSC notifications' },
      { name: 'SSC Official', url: 'https://ssc.nic.in', checkFor: 'New exam cycles notifications' },
      { name: 'PIB Daily', url: 'https://pib.gov.in', checkFor: 'Government schemes policy announcements' },
      { name: 'The Hindu', url: 'https://www.thehindu.com', checkFor: 'Daily current affairs editorial analysis' },
    ],
    whatToUpdate: [
      'Current affairs questions from The Hindu',
      'New government schemes and policies',
      'Budget announcements if any',
      'Important Supreme Court judgments',
      'International relations updates',
    ],
  },

  banking: {
    frequency: '7 days',
    priority: 'CRITICAL',
    sources: [
      { name: 'RBI Policy', url: 'https://rbi.org.in/scripts/monetarypolicy.aspx', checkFor: 'Repo rate CRR SLR changes' },
      { name: 'RBI Press Releases', url: 'https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx', checkFor: 'Banking regulations new circulars' },
      { name: 'SEBI', url: 'https://sebi.gov.in', checkFor: 'Capital market regulations' },
      { name: 'IBPS Official', url: 'https://ibps.in', checkFor: 'New exam notifications' },
      { name: 'Economic Times', url: 'https://economictimes.indiatimes.com', checkFor: 'Banking sector mergers acquisitions' },
    ],
    whatToUpdate: [
      'Repo rate CRR SLR current values',
      'New banking schemes launched',
      'Bank mergers and acquisitions',
      'New digital payment systems UPI updates',
      'RBI guidelines and circulars',
    ],
  },

  engineering: {
    frequency: '30 days',
    priority: 'MEDIUM',
    sources: [
      { name: 'GATE Official', url: 'https://gate2026.iitb.ac.in', checkFor: 'Syllabus changes exam pattern' },
      { name: 'BHEL Recruitment', url: 'https://bhel.com/careers', checkFor: 'New recruitment notifications' },
      { name: 'ISRO', url: 'https://isro.gov.in', checkFor: 'Launches achievements new technology' },
    ],
    whatToUpdate: [
      'New technology trends in respective fields',
      'PSU recruitment notifications',
      'Industry news relevant to engineering',
      'New standards and codes if any',
    ],
  },

  medical: {
    frequency: '14 days',
    priority: 'HIGH',
    sources: [
      { name: 'NMC Guidelines', url: 'https://nmc.org.in', checkFor: 'Medical education regulations' },
      { name: 'Ministry of Health', url: 'https://mohfw.gov.in', checkFor: 'New health schemes disease updates' },
      { name: 'WHO India', url: 'https://www.who.int/india', checkFor: 'Health guidelines disease outbreaks' },
      { name: 'NBE NEET PG', url: 'https://natboard.edu.in', checkFor: 'Exam pattern changes notifications' },
    ],
    whatToUpdate: [
      'New treatment guidelines protocols',
      'Disease outbreak awareness questions',
      'New drugs approved by CDSCO',
      'Health scheme updates Ayushman Bharat etc',
      'Medical research breakthroughs India',
    ],
  },

  students: {
    frequency: '14 days',
    priority: 'HIGH',
    sources: [
      { name: 'MH-CET Cell', url: 'https://cetcell.mahacet.org', checkFor: 'CET dates syllabus changes' },
      { name: 'JEE NTA', url: 'https://jeemain.nta.nic.in', checkFor: 'JEE pattern changes' },
      { name: 'NCERT', url: 'https://ncert.nic.in', checkFor: 'Textbook updates curriculum changes' },
      { name: 'TCS NQT', url: 'https://www.tcs.com/careers', checkFor: 'Campus placement pattern changes' },
    ],
    whatToUpdate: [
      'New exam patterns announced',
      'Syllabus changes if any',
      'Campus placement trends',
      'New skills companies asking for',
      'Scholarship opportunities',
    ],
  },

  business: {
    frequency: '14 days',
    priority: 'MEDIUM',
    sources: [
      { name: 'CAT Official', url: 'https://iimcat.ac.in', checkFor: 'Exam pattern changes dates' },
      { name: 'Economic Times', url: 'https://economictimes.indiatimes.com', checkFor: 'Business news GD topics' },
      { name: 'Ministry of Commerce', url: 'https://commerce.gov.in', checkFor: 'Trade policy economic updates' },
    ],
    whatToUpdate: [
      'Current business news GD topics',
      'New economic policies',
      'Startup ecosystem updates',
      'Stock market major movements',
      'International trade news India',
    ],
  },

  it_tech: {
    frequency: '14 days',
    priority: 'MEDIUM',
    sources: [
      { name: 'NASSCOM', url: 'https://nasscom.in', checkFor: 'IT industry trends hiring patterns' },
      { name: 'MeitY', url: 'https://meity.gov.in', checkFor: 'Digital India tech policy updates' },
    ],
    whatToUpdate: [
      'New technology frameworks popular',
      'Cloud computing trends',
      'AI ML latest developments',
      'Company-specific interview changes',
      'New programming languages in demand',
    ],
  },

  all: {
    frequency: '7 days',
    priority: 'CRITICAL',
    sources: [
      { name: 'The Hindu', url: 'https://www.thehindu.com', checkFor: 'Everything — primary source for all' },
      { name: 'PIB India', url: 'https://pib.gov.in', checkFor: 'Official government announcements' },
      { name: 'BBC India', url: 'https://www.bbc.com/news/world/asia/india', checkFor: 'International perspective India news' },
    ],
    whatToUpdate: [
      'Major national events',
      'Important awards and recognitions',
      'Sports achievements India',
      'Science technology breakthroughs',
      'International relations updates',
    ],
  },
}

export const getNextCheckDate = (frequencyStr) => {
  const days = parseInt(frequencyStr)
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export const getSectorUpdatePriority = (sector) => {
  return UPDATE_SCHEDULE[sector]?.priority || 'MEDIUM'
}
