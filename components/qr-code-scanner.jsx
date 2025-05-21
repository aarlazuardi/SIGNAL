"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";

export default function QRCodeScanner({ onScan, onClose }) {
  const [isStarted, setIsStarted] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameras, setCameras] = useState([]);
  const scannerRef = useRef(null);
  const { addToast: toast } = useToast();

  useEffect(() => {
    // Initialize scanner when component mounts
    scannerRef.current = new Html5Qrcode("qr-reader");

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          setSelectedCamera(devices[0].id);
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        toast({
          title: "Error",
          description:
            "Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin kamera.",
          variant: "destructive",
        });
      });

    // Cleanup when component unmounts
    return () => {
      if (scannerRef.current && isStarted) {
        try {
          scannerRef.current
            .stop()
            .catch((err) => console.error("Error stopping scanner", err));
        } catch (error) {
          console.error("Error stopping scanner", error);
        }
      }
    };
  }, [toast]);

  const startScanner = () => {
    if (!selectedCamera) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    scannerRef.current
      .start(
        selectedCamera,
        config,
        (decodedText) => handleScan(decodedText),
        (errorMessage) => console.log(errorMessage)
      )
      .catch((err) => {
        console.error("Error starting scanner", err);
        toast({
          title: "Error",
          description: "Gagal memulai scanner. " + err.message,
          variant: "destructive",
        });
      });

    setIsStarted(true);
  };

  const stopScanner = () => {
    if (scannerRef.current && isStarted) {
      scannerRef.current
        .stop()
        .then(() => {
          setIsStarted(false);
        })
        .catch((err) => {
          console.error("Error stopping scanner", err);
        });
    }
  };

  const handleScan = (decodedText) => {
    try {
      // Try to parse the QR data as JSON
      const data = JSON.parse(decodedText);
      stopScanner();
      onScan(data);
    } catch (error) {
      console.error("Invalid QR code data:", error);
      toast({
        title: "Format QR tidak valid",
        description:
          "QR code yang dipindai tidak berisi data jurnal yang valid.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="qr-scanner-container">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">Scan QR Code Jurnal</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div
        id="qr-reader"
        className="mb-4 overflow-hidden rounded-lg"
        style={{ width: "100%" }}
      ></div>

      <div className="space-y-4">
        {cameras.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              disabled={isStarted}
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-center">
          {!isStarted ? (
            <Button
              onClick={startScanner}
              disabled={!selectedCamera}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Camera className="mr-2 h-4 w-4" /> Mulai Scan
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="outline">
              Hentikan Scan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
