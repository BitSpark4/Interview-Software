import { scoreColor, scoreBorderColor } from '../utils/scoreHelpers'

export default function ScoreBadge({ score }) {
  return (
    <span className={`font-mono font-bold text-sm border rounded-md px-2 py-0.5 ${scoreColor(score)} ${scoreBorderColor(score)}`}>
      {score}/10
    </span>
  )
}
