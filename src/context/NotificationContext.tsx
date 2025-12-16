// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";

import {
  getAllNotifications,
  getUnreadNotifications,
  getReadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification as NotificationType,
} from "@/api/assetApi";

interface NotificationContextProps {
  notifications: NotificationType[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setActiveTab: (tab: "all" | "unread" | "read") => void;
  activeTab: "all" | "unread" | "read";
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

  /** ===================================================
   *                LOAD NOTIFICATIONS + UNREAD COUNT
   * =================================================== */
  const loadNotifications = async () => {
    try {
      let list: NotificationType[] = [];

      if (activeTab === "all") list = await getAllNotifications();
      else if (activeTab === "unread") list = await getUnreadNotifications();
      else if (activeTab === "read") list = await getReadNotifications();

      setNotifications(list);

      // Always fetch unread count
      const unread = await getUnreadNotifications();
      setUnreadCount(unread.length);

    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  /** ===================================================
   *                 SIGNALR REAL TIME
   * =================================================== */
  useEffect(():any => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7208/hubs/notifications", {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    connection.start().catch(console.error);

    connection.on("ReceiveNotification", (notif: NotificationType) => {
      playNotificationSound()
      toast.info(notif.title || notif.text);
      console.log(notif.title || notif.text);

      // Increase unread count
      setUnreadCount((prev) => prev + 1);

      // Reload list if on ALL or UNREAD tabs
      if (activeTab !== "read") loadNotifications();
    });

    return () => connection.stop();
  }, [activeTab]);

  /** ===================================================
   *            MARK SINGLE NOTIFICATION READ
   * =================================================== */
  const markRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);

      // Decrease unread count safely
      setUnreadCount((prev) => Math.max(prev - 1, 0));

      loadNotifications();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  /** ===================================================
   *            MARK ALL NOTIFICATIONS READ
   * =================================================== */
  const markAllRead = async () => {
    try {
      await markAllNotificationsAsRead();

      // Reset unread count
      setUnreadCount(0);

      setActiveTab("read");
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  function playNotificationSound() {
  const audioCtx = new (window.AudioContext)();

  // Helper function to play a single tone
  function playTone(frequency:any, duration:any, startTime:any) {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'triangle'; // softer than sine
    oscillator.frequency.setValueAtTime(frequency, startTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.15, startTime);

    // quick fade out
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  const now = audioCtx.currentTime;
  playTone(1000, 0.15, now);       // first tone
  playTone(1200, 0.15, now + 0.15); // second tone
}


  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
