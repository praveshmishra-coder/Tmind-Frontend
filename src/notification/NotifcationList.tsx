import React, { useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import { Bell } from "lucide-react";

export const NotificationList = () => {
    const { notifications } = useNotifications();
    const [filter, setFilter] = useState<"all" | "read" | "unread">("all");

    const fmt = (n: number | null | undefined) =>
        typeof n === "number" && Number.isFinite(n)
            ? (Math.round(n * 10) / 10).toLocaleString()
            : "-";

    const fmtDate = (iso: string | null | undefined) => {
        try {
            return iso ? new Date(iso).toLocaleString() : "-";
        } catch {
            return "-";
        }
    };

    const parsePayload = (notif: any) => {
        try {
            return typeof notif.text === "string"
                ? JSON.parse(notif.text)
                : notif.text;
        } catch {
            return null;
        }
    };

    const isResolvedLike = (data: any) =>
        !!data && (typeof data.durationSeconds === "number" || (data.from && data.to));

    const isStartLike = (data: any) =>
        !!data &&
        (!!data.status || typeof data.value === "number" || typeof data.percent === "number");

    const filtered = notifications.filter((n: any) => {
        if (filter === "all") return true;
        if (filter === "read") return n.isRead === true;
        if (filter === "unread") return n.isRead !== true;
    });

    return (
        <div className="flex flex-col h-full">
            {/* {console.log("Notifications:", notifications)} */}
            {/* === FILTER BAR === */}
            <div className="border-b px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-6">
                    {["all", "unread", "read"].map((key) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key as any)}
                            className={`pb-2 text-sm font-medium transition border-b-2 ${
                                filter === key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* === LIST === */}
            <div className="flex-1 overflow-y-auto p-4">

                {filtered.length === 0 && (
                    <p className="text-gray-500 text-center py-10">
                        No notifications found
                    </p>
                )}

                {filtered.map((notif: any) => {
                    const data = parsePayload(notif);
                    const resolved = isResolvedLike(data) && !isStartLike(data);
                    const start = isStartLike(data);

                    const cardBase =
                        "relative p-4 mb-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition";

                    /** ------------------------------
                     *  PLAINTEXT NOTIFICATION
                     * ------------------------------*/
                    if (!data) {
                        return (
                            <div key={notif.id} className={cardBase}>
                                <div className="flex items-start gap-3">
                                    <Bell className="h-5 w-5 text-gray-500 mt-1" />

                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {notif.title ?? "Notification"}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            {notif.text}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {fmtDate(notif.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    /** ------------------------------
                     *  RESOLVED NOTIFICATION
                     * ------------------------------*/
                    if (resolved) {
                        const durationSeconds =
                            data.durationSeconds ??
                            Math.max(
                                0,
                                (new Date(data.to).getTime() -
                                    new Date(data.from).getTime()) / 1000
                            );

                        return (
                            <div key={notif.id} className={cardBase}>
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-xl" />

                                <div className="text-xs text-right text-gray-600">
                                    {fmtDate(data.to)}
                                </div>

                                <p className="font-semibold text-gray-800 text-sm">
                                    {data.signal} is back to normal
                                </p>

                                <div className="mt-2 text-sm flex justify-between">
                                    <div>
                                        Asset: <b>{data.asset}</b>
                                    </div>
                                    <div>
                                        Signal: <b>{data.signal}</b>
                                    </div>
                                </div>

                                {/* DETAILS */}
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border">
                                    <div>
                                        From: <b>{fmtDate(data.from)}</b>
                                    </div>
                                    <div>
                                        To: <b>{fmtDate(data.to)}</b>
                                    </div>
                                    <div className="col-span-2">
                                        Duration: <b>{Math.round(durationSeconds)} sec</b>
                                    </div>

                                    {/* ➤ MIN MAX ADDED HERE */}
                                    <div>
                                        Min: <b>{fmt(data.min)}</b>
                                    </div>
                                    <div>
                                        Max: <b>{fmt(data.max)}</b>
                                    </div>
                                </div>

                                {/* GREEN LINE */}
                                <div className="mt-2 h-1 bg-green-500 rounded-full" />
                            </div>
                        );
                    }

                    /** ------------------------------
                     *  START / HIGH / LOW
                     * ------------------------------*/
                    if (start) {
                        const isHigh = data.status === "HIGH";
                        const isLow = data.status === "LOW";

                        return (
                            <div key={notif.id} className={cardBase}>
                                <div
                                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                                        isHigh
                                            ? "bg-red-500"
                                            : isLow
                                            ? "bg-blue-500"
                                            : "bg-gray-400"
                                    }`}
                                />

                                <div className="text-xs text-right text-gray-600">
                                    {fmtDate(data.timestamp)}
                                </div>

                                <div className="font-semibold text-sm text-gray-800">
                                    {data.asset} • {data.signal}
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            isHigh
                                                ? "bg-red-100 text-red-700"
                                                : "bg-blue-100 text-blue-700"
                                        }`}
                                    >
                                        {data.status}
                                    </span>

                                    <span className="text-sm">
                                        {fmt(data.value)} {data.unit}
                                    </span>
                                </div>

                                {/* LIMITS */}
                                <div className="mt-3 grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border">
                                    <div>
                                        Min: <b>{fmt(data.min)}</b>
                                    </div>
                                    <div>
                                        Max: <b>{fmt(data.max)}</b>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    /** ------------------------------
                     *  FALLBACK JSON
                     * ------------------------------*/
                    return (
                        <div key={notif.id} className={cardBase}>
                            <p className="font-semibold">{notif.title}</p>
                            <pre className="text-xs mt-2 bg-gray-50 p-2 rounded border">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
