import { useEffect, useRef } from "react";
import api from "../../../api/axios";
import { useDriverDashboardStore } from "../state/driverDashboardState";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";

// Send a location ping if the driver moved more than this many metres,
// OR if this many milliseconds have passed since the last ping — whichever
// comes first.
const MIN_DISTANCE_METRES = 50;
const MAX_INTERVAL_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 60_000;
const GEOCODE_INTERVAL_MS = 120_000;

function haversineMetres(a: GeolocationCoordinates, b: { lat: number; lng: number }) {
    const R = 6_371_000;
    const dLat = toRad(b.lat - a.latitude);
    const dLng = toRad(b.lng - a.longitude);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
}

function toRad(deg: number) {
    return (deg * Math.PI) / 180;
}

export function useDriverLocationTracking() {
    const isOnline = useDriverDeliveryStore((s) => s.isOnline);
    const setLocationStatus = useDriverDashboardStore((s) => s.setLocationStatus);
    const setCurrentArea = useDriverDashboardStore((s) => s.setCurrentArea);

    const watchIdRef = useRef<number | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastSentRef = useRef<{ lat: number; lng: number } | null>(null);
    const lastSentAtRef = useRef<number>(0);
    const lastGeocodeAtRef = useRef<number>(0);

    useEffect(() => {
        if (!isOnline) {
            // Driver went offline — stop tracking
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            if (heartbeatRef.current !== null) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            lastSentRef.current = null;
            lastSentAtRef.current = 0;
            setLocationStatus("idle");
            return;
        }

        if (!navigator.geolocation) {
            setLocationStatus("unavailable");
            return;
        }

        setLocationStatus("acquiring");

        // Detect mobile vs desktop for appropriate GPS settings
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        const gpsOptions: PositionOptions = {
            enableHighAccuracy: isMobile,
            maximumAge: isMobile ? 10_000 : 30_000,
            timeout: isMobile ? 10_000 : 15_000,
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                setLocationStatus("active");

                const now = Date.now();
                const last = lastSentRef.current;
                const timeSinceLast = now - lastSentAtRef.current;

                // Only send if we've moved enough OR enough time has passed
                const movedEnough =
                    !last ||
                    haversineMetres(position.coords, last) >= MIN_DISTANCE_METRES;
                const timeExpired = timeSinceLast >= MAX_INTERVAL_MS;

                if (!movedEnough && !timeExpired) return;

                try {
                    await api.patch("/driver/location", { lat, lng });
                    lastSentRef.current = { lat, lng };
                    lastSentAtRef.current = now;

                    // Reverse geocode to get area name (Nominatim — free, no key needed)
                    // Only do this on the first fix and when area is stale (every ~2 min)
                    const timeSinceGeocode = now - lastGeocodeAtRef.current;
                    if (!last || timeSinceGeocode > GEOCODE_INTERVAL_MS) {
                        lastGeocodeAtRef.current = now;
                        fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
                            { headers: { "Accept-Language": "en" } }
                        )
                            .then((r) => r.json())
                            .then((data) => {
                                const area =
                                    data.address?.suburb ??
                                    data.address?.town ??
                                    data.address?.city ??
                                    data.address?.county ??
                                    "Unknown area";
                                setCurrentArea(area);
                            })
                            .catch(() => { }); // silently ignore geocoding failures
                    }
                } catch {
                    // Location ping failed — don't crash or alert, just skip this tick
                }
            },
            (err) => {
                console.warn("[locationTracking] GPS error:", err.code, err.message);
                if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
                    setLocationStatus("denied");
                } else {
                    setLocationStatus("unavailable");
                }
            },
            gpsOptions
        );

        // Heartbeat: send the last known location every 60s even if watchPosition
        // stops firing (minimized tab, battery optimization, etc.)
        heartbeatRef.current = setInterval(async () => {
            const last = lastSentRef.current;
            if (!last) return;
            const staleSecs = (Date.now() - lastSentAtRef.current) / 1000;
            if (staleSecs < 50) return; // watchPosition is still active, skip
            try {
                await api.patch("/driver/location", last);
                lastSentAtRef.current = Date.now();
            } catch {
                // silent — don't crash on heartbeat failure
            }
        }, HEARTBEAT_INTERVAL_MS);

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            if (heartbeatRef.current !== null) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };
    }, [isOnline, setCurrentArea, setLocationStatus]);
}