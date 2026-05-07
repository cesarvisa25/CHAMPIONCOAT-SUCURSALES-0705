/**
 * Calcula la distancia entre dos coordenadas geográficas usando la fórmula Haversine.
 * @returns Distancia en metros
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Determina el estado de asistencia basado en hora de entrada y horario.
 */
export function determineAttendanceStatus(
  checkInTime: Date,
  scheduleStart: string,
  toleranceMinutes: number,
  faceVerified: boolean,
  withinRadius: boolean
): string {
  if (!faceVerified) return "FACIAL_FALLIDO";
  if (!withinRadius) return "FUERA_UBICACION";

  const [hh, mm] = scheduleStart.split(":").map(Number);
  const scheduled = new Date(checkInTime);
  scheduled.setHours(hh, mm, 0, 0);

  const toleranceMs = toleranceMinutes * 60 * 1000;
  const diff = checkInTime.getTime() - scheduled.getTime();

  if (diff <= toleranceMs) return "A_TIEMPO";
  return "RETARDO";
}

/**
 * Formatea una fecha a YYYY-MM-DD en zona local.
 */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Devuelve la hora HH:MM de una fecha.
 */
export function toTimeString(date: Date): string {
  return date.toTimeString().slice(0, 5);
}
