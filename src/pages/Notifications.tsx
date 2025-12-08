import React from "react";
import { NotificationList } from "./NotifcationList";

export default function Notifications() {
  return (
    <div className="p-2 max-w-4xl mx-auto">

      <h1 className="text-2xl font-semibold mb-2">Notifications</h1>
      <p className="text-muted-foreground mb-4">
        Manage and view your latest alerts.
      </p>

      <div className="bg-white border rounded-xl shadow-sm p-0">
        <NotificationList />
      </div>

    </div>
  );
}
