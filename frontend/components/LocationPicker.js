"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

// Fix default marker icon issue in Leaflet + Webpack
if (typeof window !== "undefined" && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function LocationMarker({ value, onChange }) {
  const [position, setPosition] = useState(value || { lat: 23.8103, lng: 90.4125 });
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onChange && onChange(e.latlng);
    },
  });
  return <Marker position={position} />;
}

export default function LocationPicker({ value, onChange }) {
  return (
    <div style={{ width: "100%", height: 400 }}>
      <MapContainer
        center={value ? [value.lat, value.lng] : [23.8103, 90.4125]}
        zoom={13}
        style={{ width: "100%", height: 400, borderRadius: 12 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
} 