import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
// shadcn/ui components (adjust import paths if different in your project)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TelemetryDto = {
  deviceId: string;
  devicePortId: string;
  portIndex: number;
  registerAddress: number;
  signalType: string;
  value: number;
  unit: string;
  timestamp: string;
};

type PortState = {
  history: number[];
  last: number;
  registerAddress: number;
  unit: string;
  signalType: string;
};

type DeviceState = {
  ports: Map<number, PortState>;
  lastUpdate: number | null;
};

type DevicesMap = Map<string, DeviceState>;
type SelectedDevice = { deviceId: string; name: string };

const SESSION_KEY = "selectedDeviceIds"; // stores SelectedDevice[] now
const CONNECT_TIMEOUT_MS = 7000; // ms - tweak if you want longer
const TELEMETRY_CACHE_KEY = "telemetryCache"; // <- persistence key
const MAX_HISTORY = 100; // keep last N points per port
const PERSIST_DEBOUNCE_MS = 1000; // batch writes to sessionStorage

export default function Signals({ hubUrl = "https://localhost:7034/hubs/modbus" }: { hubUrl?: string }) {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [devices, setDevices] = useState<DevicesMap>(() => new Map());
  // deviceNames maps deviceId -> display name (from session storage)
  const [deviceNames, setDeviceNames] = useState<Map<string, string>>(() => new Map());
  const connRef = useRef<HubConnection | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [startupErrorDetail, setStartupErrorDetail] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const prevDeviceIdsRef = useRef<string[]>([]);
  const persistTimerRef = useRef<number | null>(null);
  const [noSelectedIDs, setNoSelectedIDs] = useState<boolean>(false);

  // ===== Persistence helpers: serialize/deserialize DevicesMap =====
  function serializeDevicesMap(dm: DevicesMap) {
    const out: Record<string, any> = {};
    for (const [deviceId, dev] of dm.entries()) {
      out[deviceId] = {
        lastUpdate: dev.lastUpdate,
        ports: {},
      };
      for (const [portIndex, p] of dev.ports.entries()) {
        out[deviceId].ports[portIndex] = {
          history: p.history.slice(-MAX_HISTORY),
          last: p.last,
          registerAddress: p.registerAddress,
          unit: p.unit,
          signalType: p.signalType,
        };
      }
    }
    return JSON.stringify(out);
  }

  function deserializeDevicesMap(raw: string | null): DevicesMap {
    const dm: DevicesMap = new Map();
    if (!raw) return dm;
    try {
      const parsed = JSON.parse(raw);
      for (const deviceId of Object.keys(parsed)) {
        const devObj = parsed[deviceId];
        const portsMap = new Map<number, PortState>();
        const ports = devObj.ports || {};
        for (const key of Object.keys(ports)) {
          const idx = Number(key);
          const p = ports[key];
          portsMap.set(idx, {
            history: Array.isArray(p.history) ? p.history.slice(-MAX_HISTORY) : [],
            last: typeof p.last === "number" ? p.last : (p.history && p.history.length ? p.history[p.history.length - 1] : 0),
            registerAddress: typeof p.registerAddress === "number" ? p.registerAddress : 0,
            unit: typeof p.unit === "string" ? p.unit : "",
            signalType: typeof p.signalType === "string" ? p.signalType : "",
          });
        }
        dm.set(deviceId, { ports: portsMap, lastUpdate: devObj.lastUpdate ?? Date.now() });
      }
    } catch (e) {
      console.warn("Failed to deserialize telemetry cache", e);
    }
    return dm;
  }

  function persistTelemetry(dm?: DevicesMap) {
    if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      try {
        const toSave = serializeDevicesMap(dm ?? devices);
        sessionStorage.setItem(TELEMETRY_CACHE_KEY, toSave);
      } catch (e) {
        console.warn("Failed to persist telemetry", e);
      } finally {
        persistTimerRef.current = null;
      }
    }, PERSIST_DEBOUNCE_MS);
  }

  // helpers for session selected devices (objects with name)
  function readSelectedDevices(): SelectedDevice[] {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      // If it's an empty string, remove the specific key and return empty array
      if (raw === "") {
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {}
        return [];
      }
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((x) => {
          if (x && typeof x === "object") {
            const id = String((x as any).deviceId ?? (x as any).id ?? "");
            const name = String((x as any).name ?? (x as any).displayName ?? "");
            if (id) return { deviceId: id, name };
          }
          return null;
        })
        .filter((x): x is SelectedDevice => x !== null);
    } catch {
      return [];
    }
  }

  function readSelectedDeviceIds(): string[] {
    return readSelectedDevices().map(d => d.deviceId);
  }

  function clearSelectedDeviceIds() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }

  // New helper: clear selection (unsubscribe, remove keys, reset UI)
  async function clearSelectionAndReset(redirectToDevices = false) {
    // Best-effort unsubscribe from server for currently known device ids
    const ids = readSelectedDeviceIds();
    for (const id of ids) {
      try {
        await connRef.current?.invoke("UnsubscribeFromDevice", id);
      } catch (err) {
        console.warn("Failed to unsubscribe during clear:", id, err);
      }
    }

    // Remove only the keys we manage
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    try { sessionStorage.removeItem(TELEMETRY_CACHE_KEY); } catch {}

    // Reset local UI state immediately so the panels vanish
    setDevices(new Map());
    setDeviceNames(new Map());
    prevDeviceIdsRef.current = [];
    setNoSelectedIDs(true);

    if (redirectToDevices) {
      window.location.href = "/devices";
    }
  }

  // -------------------
  // MOUNT: load selected + telemetry (selected-first)
  // -------------------
  useEffect(() => {
    const selected = readSelectedDevices();
    // seed prevDeviceIdsRef so the interval unsubscription logic has an initial baseline
    prevDeviceIdsRef.current = selected.map(s => s.deviceId);

    if (!selected.length) {
      // No selected devices -> ensure UI is empty and do NOT rehydrate telemetry panels
      setDevices(new Map());
      setDeviceNames(new Map());
      setNoSelectedIDs(true);
      return;
    }

    // If we have selected devices, optionally restore telemetry but only for selected ids
    const cached = sessionStorage.getItem(TELEMETRY_CACHE_KEY);
    if (cached) {
      const dm = deserializeDevicesMap(cached);
      if (dm && dm.size) {
        // keep only selected ids to avoid showing panels for unselected devices
        const filtered = new Map<string, DeviceState>();
        for (const s of selected) {
          if (dm.has(s.deviceId)) filtered.set(s.deviceId, dm.get(s.deviceId)!);
          else filtered.set(s.deviceId, { ports: new Map<number, PortState>(), lastUpdate: null });
        }
        setDevices(filtered);
      } else {
        // create empty panels for selected devices if no telemetry cached
        const initialPanels = new Map<string, DeviceState>();
        for (const s of selected) initialPanels.set(s.deviceId, { ports: new Map<number, PortState>(), lastUpdate: null });
        setDevices(initialPanels);
      }
    } else {
      const initialPanels = new Map<string, DeviceState>();
      for (const s of selected) initialPanels.set(s.deviceId, { ports: new Map<number, PortState>(), lastUpdate: null });
      setDevices(initialPanels);
    }

    // set device names from selected list
    setDeviceNames(prev => {
      const next = new Map(prev);
      for (const s of selected) next.set(s.deviceId, s.name || s.deviceId);
      return next;
    });
    setNoSelectedIDs(false);
    // run once on mount
  }, []);

  // Track and handle device unsubscriptions (interval compares prevDeviceIdsRef <-> session storage)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const currentStoredIds = readSelectedDeviceIds();
      const prevIds = prevDeviceIdsRef.current;
      // If nothing is selected and nothing was previously selected, do nothing
      if (prevIds.length === 0 && currentStoredIds.length === 0) {
        return;
      }

      // Find devices that were previously loaded but are no longer in storage
      const removed = prevIds.filter(id => !currentStoredIds.includes(id));

      if (removed.length > 0 && connRef.current) {
        removed.forEach(async (id) => {
          try {
            await connRef.current?.invoke("UnsubscribeFromDevice", id);
            // Remove from local state
            setDevices(prev => {
              const next = new Map(prev);
              next.delete(id);
              return next;
            });

            setDeviceNames(prev => {
              const next = new Map(prev);
              next.delete(id);
              return next;
            });
          } catch (err) {
            console.error("Failed to unsubscribe from device:", id, err);
          }
        });
      }

      // Always keep prev ref in sync with current stored IDs
      prevDeviceIdsRef.current = currentStoredIds;
    }, 1000); // Check every second

    return () => clearInterval(checkInterval);
  }, []);

  // keep prevDeviceIdsRef.current in sync when devices state changes (helps initial load logic)
  useEffect(() => {
    prevDeviceIdsRef.current = [...devices.keys()];
  }, [devices]);

  // attach handlers and start connection + auto-subscribe
  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connRef.current = conn;
    setConnection(conn);

    // telemetry handler
    conn.off("TelemetryUpdate");
    conn.on("TelemetryUpdate", (payload: TelemetryDto[] | any) => {
      if (!Array.isArray(payload) || payload.length === 0) return;
      const first = payload[0];
      const deviceId: string = (first.deviceId ?? first.DeviceId) as string;
      if (!deviceId) return;

      setDevices(prev => {
        const next = new Map(prev);
        const dev = next.get(deviceId) ?? { ports: new Map<number, PortState>(), lastUpdate: Date.now() };

        for (const itemRaw of payload) {
          const item: Partial<TelemetryDto> = {
            deviceId: itemRaw.deviceId ?? itemRaw.DeviceId,
            devicePortId: itemRaw.devicePortId ?? itemRaw.DevicePortId,
            portIndex: itemRaw.portIndex ?? itemRaw.PortIndex,
            registerAddress: itemRaw.registerAddress ?? itemRaw.RegisterAddress,
            signalType: itemRaw.signalType ?? itemRaw.SignalType,
            value: itemRaw.value ?? itemRaw.Value,
            unit: itemRaw.unit ?? itemRaw.Unit,
            timestamp: itemRaw.timestamp ?? itemRaw.Timestamp
          };

          const pIndex = Number(item.portIndex ?? -1);
          if (pIndex < 0) continue;

          const value = Number(item.value ?? 0);
          const registerAddress = Number(item.registerAddress ?? 0);
          const unit = String(item.unit ?? "");
          const signalType = String(item.signalType ?? "");

          const existing = dev.ports.get(pIndex);
          if (existing) {
            existing.history.push(value);
            if (existing.history.length > MAX_HISTORY) existing.history.shift();
            existing.last = value;
            existing.registerAddress = registerAddress;
            existing.unit = unit;
            existing.signalType = signalType;
            dev.ports.set(pIndex, existing);
          } else {
            dev.ports.set(pIndex, {
              history: [value],
              last: value,
              registerAddress,
              unit,
              signalType
            });
          }
        }

        dev.lastUpdate = Date.now();
        next.set(deviceId, dev);

        // schedule persistence after updating state
        persistTelemetry(next);

        return next;
      });
    });

    // Start connection with timeout and auto-subscribe flow
    (async () => {
      const storedIds = readSelectedDeviceIds();
      if (!storedIds.length) {
        // nothing to subscribe — clear UI and show message
        setDevices(new Map());
        setDeviceNames(new Map());
        setNoSelectedIDs(true);
        return;
      }

      const startPromise = conn.start();
      const timeoutPromise = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("connect-timeout")), CONNECT_TIMEOUT_MS));
      try {
        await Promise.race([startPromise, timeoutPromise]);
        // connection started: clear any previous startup error
        setStartupError(null);
        setStartupErrorDetail(null);
      } catch (startErr: any) {
        // Show a friendly error UI and let the user retry or clear selection manually
        console.error("SignalR failed to start (auto-subscribe). Will not clear stored device ids.", startErr);
        setStartupError("Failed to connect to realtime server. Check server/network and press Retry or go back to device list.");
        setStartupErrorDetail(String(startErr && startErr.message ? startErr.message : startErr));
        return;
      }

      // connection started, subscribe to each stored id
      for (const id of storedIds) {
        try {
          await conn.invoke("SubscribeToDevice", id);
          // ensure UI has panel for device and name is present if available in session
          setDevices(prev => {
            const next = new Map(prev);
            if (!next.has(id)) next.set(id, { ports: new Map<number, PortState>(), lastUpdate: null });
            return next;
          });
          // ensure name mapping exists from sessionStorage (if user stored it)
          const stored = readSelectedDevices().find(s => s.deviceId === id);
          if (stored && stored.name) {
            setDeviceNames(prev => {
              const next = new Map(prev);
              next.set(id, stored.name);
              return next;
            });
          }
        } catch (subErr) {
          console.warn("Failed to auto-subscribe to device", id, subErr);
        }
      }
    })();

    return () => {
      try { conn.off("TelemetryUpdate"); } catch {}
      conn.stop().catch(() => {});
      connRef.current = null;
      setConnection(null);
      // Important: do not clear session storage here — user intent is preserved across navigation.
      // Reset local state when the component unmounts so UI doesn't linger if you navigate away.
      setDevices(new Map());
      setDeviceNames(new Map());
    };
  }, [hubUrl]);

  // onclose handler — do NOT clear session storage automatically.
  useEffect(() => {
    const conn = connRef.current;
    if (!conn) return;
    const onclose = async (err?: any) => {
      console.warn("SignalR connection closed", err);
      const stored = readSelectedDeviceIds();
      if (stored.length) {
        setStartupError("Realtime connection closed. You can Retry or go back to device list.");
        setStartupErrorDetail(String(err ?? ""));
      }
    };
    conn.onclose(onclose);
    return () => {
      try { conn.off("close", onclose as any); } catch {}
    };
  }, [connection]);

  // Retry handler: try to start connection again and resubscribe
  async function handleRetry() {
    if (!connRef.current) return;
    setIsRetrying(true);
    setStartupError(null);
    setStartupErrorDetail(null);

    try {
      const startPromise = connRef.current.start();
      const timeoutPromise = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("connect-timeout")), CONNECT_TIMEOUT_MS));
      await Promise.race([startPromise, timeoutPromise]);

      // started — resubscribe
      const ids = readSelectedDeviceIds();
      for (const id of ids) {
        try {
          await connRef.current.invoke("SubscribeToDevice", id);
          setDevices(prev => {
            const next = new Map(prev);
            if (!next.has(id)) next.set(id, { ports: new Map<number, PortState>(), lastUpdate: null });
            return next;
          });
        } catch (err) {
          console.warn("Retry: failed to subscribe", id, err);
        }
      }
      setStartupError(null);
      setStartupErrorDetail(null);
    } catch (err: any) {
      console.error("Retry failed", err);
      setStartupError("Retry failed — still cannot connect. Check server/network and try again.");
      setStartupErrorDetail(String(err && err.message ? err.message : err));
    } finally {
      setIsRetrying(false);
    }
  }

  // helper to show the display name (fallback to id)
  function getDeviceDisplayName(deviceId: string) {
    return deviceNames.get(deviceId) ?? deviceId;
  }

  // render sparkline helper
  function renderSparkline(values: number[] | undefined) {
    if (!values || values.length === 0) return null;
    const w = 120, h = 36, len = values.length;
    const min = Math.min(...values), max = Math.max(...values);
    const range = (max === min) ? (Math.abs(max) || 1) : (max - min);
    const points = values.map((v, i) => {
      const x = (i / Math.max(1, len - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg width={w} height={h} className="inline-block align-middle" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" strokeWidth={1.5} className="stroke-sky-600" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // UI
  return (
    <div className="p-4 space-y-4">
      {startupError ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="mb-2 text-sm text-yellow-900">{startupError}</div>
          {startupErrorDetail ? (
            <div className="mb-2 text-xs text-red-800">
              Details: {startupErrorDetail}
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={() => handleRetry()} disabled={isRetrying}>
              {isRetrying ? "Retrying..." : "Retry"}
            </Button>
            <Button
              onClick={() => {
                clearSelectionAndReset(true);
              }}
              variant="secondary"
            >
              Back to devices (clear selection)
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          {noSelectedIDs
            ? "Subscribe to a device from the Devices page."
            : "Showing signals for subscribed devices."}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...devices.entries()].map(([deviceId, dev]) => (
          <Card key={deviceId} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Device Signals value</div>
                  <div className="text-sm font-medium">
                    Device Name: {getDeviceDisplayName(deviceId)}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th>Port</th>
                      <th>Register</th>
                      <th>Signal</th>
                      <th>Value</th>
                      <th>Unit</th>
                      <th>History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dev.ports.entries()].map(([portIndex, p]) => (
                      <tr key={portIndex}>
                        <td className="py-1">{portIndex}</td>
                        <td className="py-1">{p.registerAddress}</td>
                        <td className="py-1">{p.signalType}</td>
                        <td className="py-1 font-mono">
                          {typeof p.last === "number"
                            ? p.last.toFixed(6)
                            : "-"}
                        </td>
                        <td className="py-1">{p.unit}</td>
                        <td className="py-1">{renderSparkline(p.history)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
