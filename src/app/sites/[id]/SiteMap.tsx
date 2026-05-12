'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'

export default function SiteMap({ address }: { address: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function geocode() {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&accept-language=ja`,
          { headers: { 'Accept-Language': 'ja' } }
        )
        const data = await res.json()
        if (data[0]) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
        }
      } catch {}
      setLoading(false)
    }
    geocode()
  }, [address])

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  if (loading) {
    return (
      <div className="h-52 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
        <MapPin size={24} className="text-gray-300" />
      </div>
    )
  }

  if (!coords) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500 mb-3">地図を表示できませんでした</p>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-orange-500 font-medium"
        >
          <ExternalLink size={14} />
          Google マップで確認
        </a>
      </div>
    )
  }

  const d = 0.006
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - d},${coords.lat - d * 0.6},${coords.lng + d},${coords.lat + d * 0.6}&layer=mapnik&marker=${coords.lat},${coords.lng}`

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <iframe
        src={osmEmbedUrl}
        width="100%"
        height="220"
        style={{ border: 0 }}
        loading="lazy"
        title="現場地図"
      />
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3 text-sm text-orange-500 font-medium bg-white hover:bg-gray-50 transition-colors border-t border-gray-100"
      >
        <ExternalLink size={14} />
        Google マップで開く
      </a>
    </div>
  )
}
