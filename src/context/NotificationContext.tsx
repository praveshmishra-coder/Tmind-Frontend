// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAllNotifications,
  getUnreadNotifications,
  getReadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  acknowledgeNotification,
  Notification as NotificationType,
} from "@/api/assetApi";

interface NotificationContextProps {
  notifications: NotificationType[];
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  setActiveTab: (tab: "all" | "unread" | "read") => void;
  activeTab: "all" | "unread" | "read";
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

  const loadNotifications = async () => {
    try {
      let list: NotificationType[] = [];
      if (activeTab === "all") list = await getAllNotifications();
      else if (activeTab === "unread") list = await getUnreadNotifications();
      else list = await getReadNotifications();
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  // SignalR for real-time updates
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7208/hubs/notifications", { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    connection.start().then(() => console.log("SignalR Connected")).catch(console.error);

    connection.on("ReceiveNotification", (notif: NotificationType) => {
      toast.info(notif.title || notif.text, { position: "top-right", autoClose: 5000 });
      setNotifications(prev => [notif, ...prev]);
    });

    return () => connection.stop();
  }, []);

  const markAsReadHandler = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllReadHandler = async () => {
    try {
      await markAllNotificationsAsRead();
      setActiveTab("read"); // automatically go to Read tab
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        markAsRead: markAsReadHandler,
        markAllRead: markAllReadHandler,
        setActiveTab,
        activeTab,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// -------------------------
// Notification UI Component
// -------------------------
export const NotificationContent: React.FC = () => {
  const { notifications, markAsRead, markAllRead, activeTab, setActiveTab } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto p-4 bg-gray-50 rounded-lg shadow-md">
      {/* Tabs */}
      <div className="flex mb-4 space-x-2">
        {["all", "unread", "read"].map(tab => (
          <button
            key={tab}
            className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-800 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab(tab as "all" | "unread" | "read")}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Mark All as Read button for Unread tab */}
      {activeTab === "unread" && notifications.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={markAllRead}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            Mark All as Read
          </button>
        </div>
      )}

      {/* Notification List */}
      <ul className="space-y-3">
        {notifications.length === 0 && (
          <li className="text-gray-500 text-center py-4">No notifications</li>
        )}
        {notifications.map(n => (
          <li
            key={n.id}
            className={`p-4 rounded-lg shadow-sm flex justify-between items-start transition-colors ${
              !n.isRead ? "bg-blue-50 border-l-4 border-blue-400" : "bg-white border border-gray-200"
            }`}
          >
            <div>
              <div className="font-semibold text-gray-800">{n.title}</div>
              <div className="text-sm text-gray-600 mt-1">{n.text}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-4">
              {/* Mark as Read button only on Unread tab */}
              {!n.isRead && activeTab === "unread" && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
