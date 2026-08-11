"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Explicitly prevent importing Leaflet CSS on the server side
// Important note: We load CSS in a useEffect to ensure it only runs on the client
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  position: [number, number];
  popupText?: string;
}

// Define a custom interface to extend the Icon prototype
interface IconDefaultExtended extends L.Icon.Default {
  _getIconUrl?: unknown;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  position, 
  popupText = "Excel Pro Academy, Ontario, Canada" 
}) => {
  const [customIcon, setCustomIcon] = useState<L.Icon | null>(null);
  
  useEffect(() => {
    // Fix Leaflet default icons issue
    const fixIcons = () => {
      try {
        delete (L.Icon.Default.prototype as IconDefaultExtended)._getIconUrl;
        
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
        });
        
        // Create custom icon
        const icon = new L.Icon({
          iconUrl: "/icons/location-marker.png",
          iconSize: [35, 35],
          iconAnchor: [17, 35],
          popupAnchor: [0, -35],
        });
        
        setCustomIcon(icon);
      } catch (error) {
        console.error("Error initializing Leaflet icons:", error);
      }
    };
    
    fixIcons();
  }, []);

  return (
    <div className="h-full w-full" >
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker 
          position={position} 
          icon={customIcon || new L.Icon.Default()}
        >
          <Popup>
            <div className="text-center p-1">
              {popupText}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;