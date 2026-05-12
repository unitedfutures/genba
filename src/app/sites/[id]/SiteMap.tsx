'use client'

import { MapPin } from 'lucide-react'

export default function SiteMap({ address }: { address: string }) {
  const embedUrl =
    `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=16&hl=ja`

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <iframe
        src={embedUrl}
        width="100%"
        height="280"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title="現場地図"
      />
    </div>
  )
}
