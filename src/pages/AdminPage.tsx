import React from "react";

export default function AdminPage() {
  return (
    <div className="container">
      <h1>Admin</h1>

      <div style={{ marginTop: 12 }}>
        <button id="createUserBtn">Create User</button>

        <select id="roleSelect" style={{ marginLeft: 8 }}>
          <option>Admin</option>
          <option>Editor</option>
          <option>Viewer</option>
        </select>
      </div>
    </div>
  );
}
