// context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiAsset from "@/api/axiosAsset";

export interface Notification {
    id: string;
    title: string;
    text: string;
    createdAt: string;
    isRead: boolean;
    isAcknowledged: boolean;
}

interface NotificationContextProps {
    notifications: Notification[];
    markAsRead: (id: string) => void;
    acknowledge: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
    return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // Fetch all notifications once on mount using axios instance
        (async () => {
            try {
                // your apiAsset baseURL already includes /api
                const resp = await apiAsset.get("/notifications/all");
                // controller returns { message, data } — data holds the list
                const list: Notification[] = resp?.data?.data ?? resp?.data ?? [];
                setNotifications(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error("Failed to load notifications:", err);
            }
        })();

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7208/hubs/notifications", { withCredentials: true })
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => console.log("SignalR Connected"))
            .catch(console.error);


        connection.on("ReceiveNotification", (notif: Notification) => {
            // keep list of raw notifications
            setNotifications(prev => [notif, ...prev]);
            console.log("New notification received:", notif);

            // parse safely
            let data: any = null;
            try {
                data = typeof notif.text === "string" ? JSON.parse(notif.text) : notif.text;
            } catch (e) {
                console.error("Failed to parse notification payload:", e);
            }

            if (!data) {
                // fallback to simple text if parse fails
                toast.info(notif.text ?? "New notification", {
                    position: "top-right",
                    autoClose: 5000,
                });
                return;
            }

            console.log("Parsed notification data:", data);

            // small helpers
            const fmt = (n: number | null | undefined) =>
                typeof n === "number" && Number.isFinite(n) ? (Math.round(n * 10) / 10).toLocaleString() : "-";

            const fmtDate = (iso: string | null | undefined) => {
                try { return iso ? new Date(iso).toLocaleString() : "-"; } catch { return "-"; }
            };

            // Distinguish between START/ONGOING (has status) and RESOLVED (has duration/from/to)
            const isStartLike = !!(data.status || data.value || data.percent);
            const isResolvedLike = typeof data.durationSeconds === "number" || (data.from && data.to);

            if (isResolvedLike && !isStartLike) {
                // RESOLVED summary toast
                const durationSeconds = data.durationSeconds ?? Math.max(0, (new Date(data.to).getTime() - new Date(data.from).getTime()) / 1000);
                const title = `${data.signal ?? "Signal"} back to normal — ${data.asset ?? ""}`.trim();

                toast(
                    <div className="w-96 max-w-full">
                        <div className="flex">
                            <div className="w-1 rounded-l-md mr-3 bg-green-500" aria-hidden />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold">
                                        {title}
                                        <div className="text-gray-500 text-xs font-normal">Resolved</div>
                                    </div>
                                    <div className="text-xs text-gray-600">{fmtDate(data.to)}</div>
                                </div>

                                <div className="mt-2 text-sm text-gray-700">
                                    <div>Signal: <span className="font-medium">{data.signal ?? "-"}</span></div>
                                    <div>Asset: <span className="font-medium">{data.asset ?? "-"}</span></div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div>From: <div className="font-medium text-gray-800">{fmtDate(data.from)}</div></div>
                                    <div>To: <div className="font-medium text-gray-800">{fmtDate(data.to)}</div></div>
                                    <div>Duration: <div className="font-medium text-gray-800">{Math.round(durationSeconds)}s</div></div>
                                </div>

                                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                                    <div>Min: <span className="font-medium text-gray-800">{fmt(data.min)}</span></div>
                                    <div>Max: <span className="font-medium text-gray-800">{fmt(data.max)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    {
                        position: "top-right",
                        autoClose: 9000,
                        pauseOnHover: true,
                        closeOnClick: true,
                        draggable: true,
                        hideProgressBar: false,
                    }
                );
                return;
            }

            if (isStartLike) {
                // START / ONGOING toast (existing style, tuned a bit)
                const isHigh = data?.status === "HIGH";
                const isLow = data?.status === "LOW";
                const percent = typeof data.percent === "number" ? data.percent : 0;
                const progress = Math.min(Math.abs(percent), 100);

                toast(
                    <div className="w-96 max-w-full">
                        <div className="flex">
                            <div
                                className={`w-1 rounded-l-md mr-3 ${isHigh ? "bg-red-500" : isLow ? "bg-blue-500" : "bg-gray-400"}`}
                                aria-hidden
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{isHigh ? "🔔" : isLow ? "ℹ️" : "⚠️"}</span>
                                        <div className="text-sm font-semibold leading-tight">
                                            <span>{data.asset ?? "-"}</span>
                                            <span className="text-gray-500 font-normal"> • {data.signal ?? "-"}</span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-600">
                                        {fmtDate(data.timestamp ?? data.time ?? new Date().toISOString())}
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                    <div className="text-sm">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isHigh ? "bg-red-100 text-red-700" : isLow ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                                            {data.status ?? "ALERT"}
                                        </span>

                                        <span className="ml-2 text-sm text-gray-700">{fmt(data.value)}</span>
                                        <span className="ml-2 text-xs text-gray-500"> {data.unit ?? ""}</span>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <div>Deviation: <span className="font-medium text-gray-800">{fmt(percent)}%</span></div>
                                        <div className="text-right">Δ {fmt(Math.abs(data.value - (data.status === "HIGH" ? data.max : data.min)))}</div>
                                    </div>

                                    <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isHigh ? "bg-red-500" : isLow ? "bg-blue-500" : "bg-gray-500"}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                                        <div>Min: <span className="font-medium text-gray-800 ml-1">{fmt(data.min)}</span></div>
                                        <div>Max: <span className="font-medium text-gray-800 ml-1">{fmt(data.max)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    {
                        position: "top-right",
                        autoClose: 7000,
                        pauseOnHover: true,
                        closeOnClick: true,
                        draggable: true,
                        hideProgressBar: false,
                    }
                );
                return;
            }

            // fallback generic
            toast.info(JSON.stringify(data), {
                position: "top-right",
                autoClose: 5000,
            });
        });

        return () => {
            connection.stop();
        };
    }, []);

    const markAsRead = async (id: string) => {
        try {
            // using axios instance
            await apiAsset.post(`/notifications/read/${id}`);
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const acknowledge = async (id: string) => {
        try {
            await apiAsset.post(`/notifications/ack/${id}`);
        } catch (err) {
            console.error("Failed to acknowledge notification:", err);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, markAsRead, acknowledge }}>
            {children}
        </NotificationContext.Provider>
    );
};
