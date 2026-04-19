import React, { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import axios from 'axios'
import './EventLocationPicker.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [27.7172, 85.324]
const DEFAULT_ZOOM = 12
const PIN_ZOOM = 17

const MapFlyTo = ({ lat, lng, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.flyTo([lat, lng], zoom, { duration: 1 })
    }
  }, [lat, lng, zoom, map])
  return null
}

/**
 * Event form: Nominatim search + map; updates parent state for location, latitude, longitude.
 * Lat/lng are not typed manually (hidden + read-only summary).
 */
const EventLocationPicker = ({
  location,
  latitude,
  longitude,
  onChange,
  locationInputId = 'location',
  locationLabel = 'Location *',
  /** Remount map when switching records (e.g. edit different events). */
  mapKey = 'default',
  /** API path for Nominatim proxy (school vs admin). */
  geocodeSearchUrl = '/api/admin/geocode/search',
}) => {
  const latNum = parseFloat(String(latitude), 10)
  const lngNum = parseFloat(String(longitude), 10)
  const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum)

  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showResults, setShowResults] = useState(false)
  const blurTimer = useRef(null)

  useEffect(() => {
    if (!search.trim()) {
      setResults([])
      return
    }
    const handle = setTimeout(async () => {
      setSearchLoading(true)
      setSearchError('')
      try {
        const { data } = await axios.get(geocodeSearchUrl, {
          params: { q: search.trim(), limit: 5 },
        })
        setResults(data.results || [])
        setShowResults(true)
      } catch (err) {
        setSearchError(err.response?.data?.message || 'Search failed')
        setResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 650)
    return () => clearTimeout(handle)
  }, [search, geocodeSearchUrl])

  const applyChange = useCallback(
    (patch) => {
      onChange(patch)
    },
    [onChange]
  )

  const selectResult = (r) => {
    const lat = parseFloat(String(r.lat), 10)
    const lng = parseFloat(String(r.lon), 10)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    setShowResults(false)
    setSearch('')
    applyChange({
      location: r.display_name || location,
      latitude: String(lat),
      longitude: String(lng),
    })
  }

  const handleMarkerDragEnd = useCallback(
    (e) => {
      const ll = e.target.getLatLng()
      applyChange({
        latitude: String(ll.lat),
        longitude: String(ll.lng),
      })
    },
    [applyChange]
  )

  const center = hasCoords ? [latNum, lngNum] : DEFAULT_CENTER
  const initialZoom = hasCoords ? PIN_ZOOM : DEFAULT_ZOOM

  return (
    <div className="event-location-picker">
      <div className="form-group">
        <label htmlFor={locationInputId}>{locationLabel}</label>
        <input
          id={locationInputId}
          type="text"
          value={location}
          onChange={(e) => applyChange({ location: e.target.value })}
          placeholder="Filled when you pick a search result; you may shorten the text"
          required
        />
      </div>

      <input type="hidden" name="latitude" value={latitude || ''} readOnly aria-hidden="true" />
      <input type="hidden" name="longitude" value={longitude || ''} readOnly aria-hidden="true" />

      <div className="event-location-picker-search">
        <label className="picker-search-label" htmlFor={`${locationInputId}-geosearch`}>
          Search address or place
        </label>
        <div className="picker-search-row">
          <input
            id={`${locationInputId}-geosearch`}
            type="search"
            placeholder="e.g. school name, street, Kathmandu"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => {
              if (blurTimer.current) clearTimeout(blurTimer.current)
              if (results.length) setShowResults(true)
            }}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setShowResults(false), 180)
            }}
            autoComplete="off"
          />
          {searchLoading && <span className="picker-search-status">Searching…</span>}
        </div>
        {searchError && <p className="picker-search-error">{searchError}</p>}
        {showResults && results.length > 0 && (
          <ul className="picker-search-results" role="listbox">
            {results.map((r) => (
              <li key={`${r.place_id}-${r.osm_id || r.lat}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectResult(r)}
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="picker-attribution">
          Search ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{' '}
          contributors (Nominatim)
        </p>
      </div>

      <div className="event-location-picker-map-wrap">
        <MapContainer
          key={mapKey}
          center={center}
          zoom={initialZoom}
          scrollWheelZoom
          style={{ height: 260, width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap & CartoDB"
          />
          {hasCoords && (
            <>
              <MapFlyTo lat={latNum} lng={lngNum} zoom={PIN_ZOOM} />
              <Marker
                position={[latNum, lngNum]}
                draggable
                eventHandlers={{ dragend: handleMarkerDragEnd }}
              />
            </>
          )}
        </MapContainer>
      </div>

      <p className="picker-coords-readonly" aria-live="polite">
        {hasCoords
          ? `Coordinates: ${latNum.toFixed(6)}, ${lngNum.toFixed(6)} — adjust by dragging the pin`
          : 'Pick a search result to set the pin on the map.'}
      </p>
    </div>
  )
}

export default EventLocationPicker
