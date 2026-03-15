export default function RoleCard({ role, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 p-4 rounded-lg border text-left transition-all duration-150 cursor-pointer h-full min-h-11 w-full ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10 text-white'
          : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600'
      }`}
    >
      <span className="text-xl">{role.icon}</span>
      <span className="text-sm font-medium">{role.label}</span>
    </button>
  )
}
