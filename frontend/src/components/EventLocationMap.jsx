import React, { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import './EventLocationMap.css'

// Fix missing default marker icons in bundlers (Vite, CRA, etc.)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const MapAutoCenter = ({ lat, lng, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    // Leaflet maps inside animated/flex/grid cards can mount before final size.
    // Invalidate size after paint so tile layers and center align correctly.
    const refreshMap = () => {
      map.invalidateSize()
      map.setView([lat, lng], zoom, { animate: false })
    }

    refreshMap()
    const rafId = window.requestAnimationFrame(refreshMap)
    const timeoutId = window.setTimeout(refreshMap, 120)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
    }
  }, [lat, lng, zoom, map])
  return null
}

const EventLocationMap = ({ latitude, longitude, locationName, height = 220, className = '' }) => {
  const lat = Number(latitude)
  const lng = Number(longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const zoom = 17
  const googleMapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`

  return (
    <div className={`event-location-map ${className}`} style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapAutoCenter lat={lat} lng={lng} zoom={zoom} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap & CartoDB"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="event-map-popup">
              <div className="event-map-popup-title">{locationName || 'Event location'}</div>
              <div className="event-map-popup-coords">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </div>
              <a
                className="event-map-popup-link"
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

export default EventLocationMap

