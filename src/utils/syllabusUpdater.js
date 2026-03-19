import { supabase } from '../lib/supabase'

export const EXAMS_TO_CHECK = [
  {
    sector: 'government',
    exam: 'UPSC Civil Services',
    url: 'https://upsc.gov.in/examinations/syllabus',
    checkFrequency: '14 days',
    whatToCheck: 'New notifications syllabus changes exam dates',
  },
  {
    sector: 'government',
    exam: 'MPSC Maharashtra',
    url: 'https://mpsc.gov.in',
    checkFrequency: '14 days',
    whatToCheck: 'New exam notifications syllabus updates',
  },
  {
    sector: 'banking',
    exam: 'IBPS PO Clerk',
    url: 'https://ibps.in',
    checkFrequency: '14 days',
    whatToCheck: 'New exam cycle notifications pattern changes',
  },
  {
    sector: 'banking',
    exam: 'RBI Monetary Policy',
    url: 'https://rbi.org.in/scripts/monetarypolicy.aspx',
    checkFrequency: '7 days',
    whatToCheck: 'Repo rate CRR SLR changes new policies',
  },
  {
    sector: 'engineering',
    exam: 'GATE Mechanical',
    url: 'https://gate2025.iitr.ac.in',
    checkFrequency: '30 days',
    whatToCheck: 'Syllabus changes new topics removed topics',
  },
  {
    sector: 'medical',
    exam: 'NEET PG',
    url: 'https://natboard.edu.in',
    checkFrequency: '30 days',
    whatToCheck: 'Exam pattern changes new guidelines',
  },
  {
    sector: 'students',
    exam: 'CET Maharashtra',
    url: 'https://cetcell.mahacet.org',
    checkFrequency: '30 days',
    whatToCheck: 'Syllabus changes exam dates new notifications',
  },
  {
    sector: 'business',
    exam: 'CAT',
    url: 'https://iimcat.ac.in',
    checkFrequency: '30 days',
    whatToCheck: 'Exam pattern changes new sections',
  },
]

export const logUpdate = async (examName, whatChanged, actionTaken) => {
  await supabase.from('update_tracker').insert({
    exam_name: examName,
    what_changed: whatChanged,
    action_taken: actionTaken,
    checked_by: 'manual',
    next_check_date: new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0],
  })
}
