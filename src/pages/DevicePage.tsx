import React from "react";

export default function DevicePage() {
  return (
    <div className="container">
      <h1>Devices</h1>

      <div style={{ marginTop: 12 }}>
        <button id="addDeviceBtn">Add Device</button>

        <input id="deviceSearch" placeholder="Search devices..." style={{ marginLeft: 8 }} />

        <div className="device-list" style={{ marginTop: 16, border: "1px solid #eee", padding: 12 }}>
          <div>Device A — Online</div>
          <div>Device B — Offline</div>
        </div>
      </div>
    </div>
  );
}
