export default function Card({ title, value, color }) {
  return (
    <div style={{
      background: '#fff',
      padding: 20,
      borderRadius: 12,
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
      borderLeft: `5px solid ${color}`
    }}>
      <p style={{ margin: 0, color: '#666' }}>{title}</p>
      <h2 style={{ margin: '10px 0' }}>{value}</h2>
    </div>
  )
}