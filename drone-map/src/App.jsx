import "./App.css";
import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // Gunakan backend WebGL untuk performa yang lebih baik
import { detect, detectVideo } from "./components/Detect";

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
  const [position, setPosition] = useState([51.505, -0.09]);
  const [currentTime, setCurrentTime] = useState(new Date());
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
        setPosition(([lat, lng]) => [lat, lng]);
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };

    updatePosition();
    const intervalId = setInterval(updatePosition, 3000);

    return () => clearInterval(intervalId);
  }, [initialPosition]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  });

  // const loadModel = async () => {
  //   try {
  //     const model = await tf.loadGraphModel(
  //       "http://localhost:5173/yolov8n_web_model/model.json"
  //     );
  //     console.log(model);
  //     return model;
  //   } catch (error) {
  //     console.error("Error loading YOLO model:", error);
  //     return null;
  //   }
  // };

  // useEffect(() => {
  //   const getMediaStream = async () => {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({
  //         video: true,
  //       });
  //       if (videoRef.current) {
  //         videoRef.current.srcObject = stream;
  //       }
  //     } catch (error) {
  //       console.error("Error accessing webcam:", error);
  //     }
  //   };

  //   getMediaStream();
  // }, []);

  useEffect(() => {
    const tick = () => {
      setCurrentTime(new Date());
    };

    const timerId = setInterval(tick, 1000);

    return () => clearInterval(timerId);
  }, []);

  // const detectObjects = async () => {
  //   const yolo = await loadModel();
  //   const videoElement = videoRef.current;

  //   if (videoElement) {
  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext("2d");

  //     canvas.width = 640; // Set canvas width to 640 pixels
  //     canvas.height = 640; // Set canvas height to 640 pixels

  //     context.clearRect(0, 0, canvas.width, canvas.height);
  //     context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  //     const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  //     const tensor = tf.browser.fromPixels(imageData).toFloat().expandDims();

  //     const predictions = await yolo.predict(tensor);

  //     const predictionsArray = await predictions.array();
  //     console.log(predictionsArray);
  //     predictionsArray.forEach((prediction) => {
  //       const [x, y, width, height, score] = prediction;
  //       context.beginPath();
  //       context.rect(x, y, width, height);
  //       context.lineWidth = 2;
  //       context.strokeStyle = "red";
  //       context.fillStyle = "red";
  //       context.stroke();
  //       context.fillText(
  //         `Object (${(score * 100).toFixed(2)}%)`,
  //         x,
  //         y > 10 ? y - 5 : y + 15
  //       );
  //     });
  //   }

  //   requestAnimationFrame(detectObjects);
  // };

  // useEffect(() => {
  //   const init = async () => {
  //     const loadedModel = await loadModel();
  //     setModel(loadedModel);
  //   };

  //   init();

  //   return () => {
  //     if (model) {
  //       model.dispose(); // Cleanup model on unmount
  //     }
  //   };
  // }, []);

  // useEffect(() => {
  //   const videoElement = videoRef.current;

  //   if (videoElement && model) {
  //     videoElement.addEventListener("loadedmetadata", () => {
  //       detectObjects(); // Start object detection once video metadata is loaded
  //     });
  //   }
  // }, [model]);

  useEffect(() => {
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel(
        "http://localhost:5173/yolov8n_web_model/model.json"
      );

      const dummyInput = tf.ones(yolov8.inputs[0].shape);
      const warmupResults = yolov8.execute(dummyInput);

      setModel({
        net: yolov8,
        inputShape: yolov8.inputs[0].shape,
      });

      tf.dispose([warmupResults, dummyInput]);
    });
  }, []);
  useEffect(() => {
    if (videoRef.current && model) {
      const getMediaStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadedmetadata", () => {
            detectVideo(videoRef.current, model, canvasRef.current);
          });
        } catch (error) {
          console.error("Error accessing webcam:", error);
        }
      };

      getMediaStream();
    }
  }, [model]);
  return (
    <>
      <div style={{ width: "100%", height: "30px", margin: "10px" }}>
        <h1 className="text-center font-bold text-2xl">Zephyr</h1>
      </div>
      <video
        autoPlay
        muted
        ref={videoRef}
        width={640}
        height={480}
        style={{ position: "absolute", zIndex: "99999" }}
        onPlay={() => detectVideo(videoRef.current, model, canvasRef.current)}
      />
      <canvas
        width={model.inputShape[1]}
        height={model.inputShape[2]}
        style={{ position: "absolute", zIndex: "99999" }}
        ref={canvasRef}
      />
      <>
        <div
          className=""
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            margin: "20px",
            zIndex: "9999999",
          }}
        >
          <div className="border-2 border-black p-2">
            <h6>Information</h6>
            <p>Time: {currentTime.toLocaleTimeString()}</p>
            <p>Latitude: {position[0]}</p>
            <p>Longtitude: {position[1]}</p>
          </div>
        </div>
      </>
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
    </>
  );
}

export default App;
