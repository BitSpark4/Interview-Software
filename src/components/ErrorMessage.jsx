export default function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <p className="text-red-400 text-sm mt-1">{message}</p>
  )
}
