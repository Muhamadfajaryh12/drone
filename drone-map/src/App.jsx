import "./App.css";
import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
function UpdateMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position.length > 0) {
      map.flyTo(position, 16);
    }
  }, [position, map]);
  return null;
}

function App() {
  const [position, setPosition] = useState([51.505, -0.09]); // Default position
  const [initialPosition, setInitialPosition] = useState(null);

  const getLocationData = async (lat, long) => {
    try {
      const response = await axios.post("http://localhost:3000/location", {
        lat: lat,
        long: long,
      });
      console.log(response);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const updatePosition = () => {
      if (navigator.geolocation && !initialPosition) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setPosition([latitude, longitude]);
            getLocationData(latitude, longitude);
            setInitialPosition([latitude, longitude]);
          },
          (error) => {
            console.error("Error obtaining location: ", error);
          }
        );
      } else if (initialPosition) {
        setPosition(([lat, lng]) => [lat + 0.001, lng + 0.001]);
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };

    // Update position initially
    updatePosition();
    // Update position every 10 seconds
    const intervalId = setInterval(updatePosition, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [initialPosition]);
  return (
    <MapContainer
      center={position}
      zoom={16}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}></Marker>
      <UpdateMap position={position} />
    </MapContainer>
  );
}

export default App;
