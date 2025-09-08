import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Home() {
  const [slug, setSlug] = useState('')
  const nav = useNavigate()

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
      <h1>Davete Katılım</h1>
      <p>Size gönderilen davet linkindeki <b>slug</b>’ı girin veya direkt linkten ziyaret edin.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (slug.trim()) nav(`/invitation/${slug.trim()}`)
        }}
      >
        <input
          placeholder="ör: company-meetup-2025"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={{ width: '100%', padding: 10, marginTop: 12 }}
        />
        <button
          type="submit"
          style={{ marginTop: 12, padding: '10px 16px', width: '100%' }}
        >
          Devam Et
        </button>
      </form>
    </div>
  )
}
