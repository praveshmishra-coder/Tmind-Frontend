import React from "react";

export default function AssetPage() {
  return (
    <div className="container">
      <h1>Assets</h1>

      <div style={{ marginTop: 12 }}>
        <button id="addAssetBtn">Add Asset</button>

        <input id="assetFilter" placeholder="Filter assets..." style={{ marginLeft: 8 }} />

        <div id="assetTable" style={{ marginTop: 16, border: "1px solid #eee", padding: 12 }}>
          <table style={{ width: "100%" }}>
            <thead>
              <tr><th>Name</th><th>Type</th></tr>
            </thead>
            <tbody>
              <tr><td>Asset 1</td><td>Type A</td></tr>
              <tr><td>Asset 2</td><td>Type B</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
