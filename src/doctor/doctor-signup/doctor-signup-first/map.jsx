import { MapContainer, TileLayer, useMapEvents, Marker } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";
import styles from "./doctor-signup-first.module.css";
import { useEffect } from "react";
export default function LocationPicker({ onSelect, loca }) {
  const [position, setPosition] = useState(null);
  function MapClickHandler() {
    const map = useMapEvents({
      click(e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, 15);
        onSelect(e.latlng);
      },
    });
    return null;
  }
  useEffect(() => {
    if (loca) {
      setPosition(loca);
      onSelect(loca);
    }
  }, [loca]);
  const gpsIcon = L.divIcon({
    className: "",
    html: `
    <span class=${styles.gps_marker}>
      location_on
    </span>
  `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
  return (
    <MapContainer
      center={!loca ? [35.2016, -0.6348] : [loca.lat, loca.lng]} // Algeria
      zoom={!loca ? 10 : 14.5}
      style={{ height: "300px", width: "100%", borderRadius: "10px" }}
    >
      <TileLayer
        attribution=""
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />

      {position && <Marker position={position} icon={gpsIcon} />}
    </MapContainer>
  );
}
