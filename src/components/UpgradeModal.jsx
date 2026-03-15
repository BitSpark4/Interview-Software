import { Link } from 'react-router-dom'

export default function UpgradeModal({ resetDate, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full space-y-4">
        <h2 className="text-white font-bold text-lg leading-tight">
          You've used all 3 free interviews this month
        </h2>
        <p className="text-gray-400 text-sm">
          Resets on <span className="text-white">{resetDate}</span>
        </p>
        <p className="text-gray-300 text-sm">
          Upgrade to Pro for unlimited interviews, resume-aware questions, and STAR coaching.
        </p>
        <Link
          to="/upgrade"
          className="block w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-center transition-colors"
        >
          Upgrade — ₹199/month
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="block w-full text-gray-500 hover:text-gray-300 text-sm text-center transition-colors py-1"
        >
          Wait until next month
        </button>
      </div>
    </div>
  )
}
