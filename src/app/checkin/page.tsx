"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";

type Step = "idle" | "loading" | "camera" | "face-ok" | "done" | "error";

export default function CheckinPage() {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("idle");
  const [mode, setMode] = useState<"checkin" | "checkout">("checkin");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceStatus, setFaceStatus] = useState<"idle" | "scanning" | "ok" | "fail">("idle");
  const [result, setResult] = useState<any>(null);

  const name = session?.user?.name || "Empleado";

  // Obtener geolocalización
  function getLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocalización no soportada");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject("No se pudo obtener ubicación: " + err.message),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }

  // Iniciar cámara
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      throw new Error("No se pudo acceder a la cámara");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  // Captura imagen del video
  function captureFrame(): string | null {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  // Simular reconocimiento facial (en producción usar face-api.js)
  async function performFaceRecognition(): Promise<boolean> {
    setFaceStatus("scanning");
    await new Promise((r) => setTimeout(r, 2000)); // Simular procesamiento
    // En producción: comparar descriptores faciales del empleado con el frame actual
    setFaceStatus("ok");
    return true;
  }

  async function handleAction() {
    setStep("loading");
    setMessage("Obteniendo ubicación...");

    try {
      // 1. Obtener ubicación
      let loc: { lat: number; lon: number };
      try {
        loc = await getLocation();
        setLocation(loc);
      } catch (e) {
        setStep("error");
        setMessage("No se pudo obtener tu ubicación. Por favor habilita el GPS. " + String(e));
        return;
      }

      // 2. Activar cámara
      setMessage("Activando cámara...");
      setStep("camera");
      await startCamera();

      // 3. Reconocimiento facial
      setMessage("Verificando identidad...");
      const faceOk = await performFaceRecognition();

      // 4. Capturar frame
      const photoRef = captureFrame();
      stopCamera();

      // 5. Enviar al servidor
      setStep("loading");
      setMessage("Registrando asistencia...");

      const url = mode === "checkin" ? "/api/attendance" : "/api/attendance/checkout";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: loc.lat,
          longitude: loc.lon,
          faceVerified: faceOk,
          deviceInfo: navigator.userAgent.slice(0, 200),
          photoRef: photoRef ? "captured" : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setStep("done");
        setMessage(
          mode === "checkin"
            ? `¡Check-in registrado! Estado: ${statusLabel(data.status)}`
            : `¡Check-out registrado!`
        );
      } else {
        setStep("error");
        setMessage(data.error || "Error al registrar asistencia");
      }
    } catch (e) {
      stopCamera();
      setStep("error");
      setMessage(String(e));
    }
  }

  function reset() {
    stopCamera();
    setStep("idle");
    setMessage("");
    setFaceStatus("idle");
    setLocation(null);
    setResult(null);
  }

  function statusLabel(s: string) {
    const m: Record<string, string> = {
      A_TIEMPO: "A tiempo ✓",
      RETARDO: "Retardo ⚠️",
      CHECKOUT_REALIZADO: "Check-out realizado ✓",
      FUERA_UBICACION: "Fuera de ubicación",
      FACIAL_FALLIDO: "Facial fallido",
    };
    return m[s] || s;
  }

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), []);

  const isLoading = step === "loading";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">CC</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Control de Asistencia</h1>
          <p className="text-gray-500 text-sm">{name}</p>
        </div>

        {/* Mode toggle */}
        <div className="bg-white rounded-xl shadow-sm p-1 flex">
          <button
            onClick={() => { setMode("checkin"); reset(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${mode === "checkin" ? "bg-red-600 text-white" : "text-gray-600 hover:text-gray-800"}`}
          >
            Check-in
          </button>
          <button
            onClick={() => { setMode("checkout"); reset(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${mode === "checkout" ? "bg-red-600 text-white" : "text-gray-600 hover:text-gray-800"}`}
          >
            Check-out
          </button>
        </div>

        {/* Status indicators */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className={location ? "text-green-500" : "text-gray-400"} />
              Ubicación GPS
            </div>
            {location ? (
              <span className="text-xs text-green-600 font-medium">Detectada</span>
            ) : (
              <span className="text-xs text-gray-400">Pendiente</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Camera size={16} className={cameraActive ? "text-green-500" : "text-gray-400"} />
              Cámara
            </div>
            {cameraActive ? (
              <span className="text-xs text-green-600 font-medium">Activa</span>
            ) : (
              <span className="text-xs text-gray-400">Inactiva</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className={faceStatus === "ok" ? "text-green-500" : "text-gray-400"} />
              Reconocimiento facial
            </div>
            <span className={`text-xs font-medium ${
              faceStatus === "ok" ? "text-green-600" :
              faceStatus === "scanning" ? "text-blue-500 animate-pulse" :
              faceStatus === "fail" ? "text-red-500" : "text-gray-400"
            }`}>
              {faceStatus === "ok" ? "Verificado" : faceStatus === "scanning" ? "Escaneando..." : faceStatus === "fail" ? "Fallido" : "Pendiente"}
            </span>
          </div>
        </div>

        {/* Camera view */}
        {step === "camera" && (
          <div className="bg-black rounded-xl overflow-hidden relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl" />
            {/* Face scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-4 border-red-400 rounded-full opacity-60 animate-pulse" />
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <p className="text-white text-sm bg-black/50 inline-block px-3 py-1 rounded-full">
                Mirando hacia la cámara...
              </p>
            </div>
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Message */}
        {message && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${
            step === "error" ? "bg-red-50 text-red-700" :
            step === "done" ? "bg-green-50 text-green-700" :
            "bg-blue-50 text-blue-700"
          }`}>
            {step === "error" ? <XCircle size={20} className="flex-shrink-0 mt-0.5" /> :
             step === "done" ? <CheckCircle size={20} className="flex-shrink-0 mt-0.5" /> :
             <Loader2 size={20} className="flex-shrink-0 mt-0.5 animate-spin" />}
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Result details */}
        {result && step === "done" && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
            {result.distance !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Distancia a sucursal</span>
                <span className={`font-medium ${result.withinRadius ? "text-green-600" : "text-orange-500"}`}>
                  {result.distance}m {result.withinRadius ? "✓" : "(fuera de rango)"}
                </span>
              </div>
            )}
            {result.status && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estado</span>
                <span className="font-medium text-gray-800">{statusLabel(result.status)}</span>
              </div>
            )}
          </div>
        )}

        {/* Main action button */}
        {step === "idle" || step === "error" ? (
          <button
            onClick={handleAction}
            disabled={isLoading}
            className="w-full py-5 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            {mode === "checkin" ? "📍 Registrar entrada" : "🚪 Registrar salida"}
          </button>
        ) : step === "done" ? (
          <button
            onClick={reset}
            className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white text-base font-semibold rounded-2xl transition"
          >
            Nuevo registro
          </button>
        ) : (
          <div className="w-full py-5 bg-gray-200 rounded-2xl flex items-center justify-center gap-3">
            <Loader2 size={22} className="animate-spin text-gray-500" />
            <span className="text-gray-600 font-medium">Procesando...</span>
          </div>
        )}

        {/* Info */}
        <p className="text-center text-xs text-gray-400 pb-6">
          Se requiere acceso a cámara y GPS para registrar asistencia
        </p>
      </div>
    </div>
  );
}
