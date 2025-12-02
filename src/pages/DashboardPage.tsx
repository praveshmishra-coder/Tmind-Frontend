import React from "react";

export default function DashboardPage() {
  return (
    <div className="container">
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <div className="total-assets-card" style={{ padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
          <h3>Total Assets</h3>
          <p>120</p>
        </div>

        <div className="recent-activity-card" style={{ padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
          <h3>Recent Activity</h3>
          <p>Latest updates appear here.</p>
        </div>
      </div>
    </div>
  );
}
