export default function Spinner({ size = 16, color = 'border-black' }) {
  return (
    <span
      style={{ width: size, height: size, minWidth: size }}
      className={`inline-block rounded-full border-2 ${color} border-t-transparent animate-[spin_0.7s_linear_infinite]`}
    />
  )
}
