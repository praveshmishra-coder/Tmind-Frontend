import { useLocation } from "react-router-dom";

export default function Signal() {
  const { state } = useLocation();
  const asset = state?.asset; // contains BackendAsset object

  if (!asset) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-500">No asset data received</h1>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold mb-2">Asset Details</h1>

      <div className="p-4 border border-border rounded-lg bg-card shadow">
        <p><strong>Asset ID:</strong> {asset.assetId}</p>
        <p><strong>Name:</strong> {asset.name}</p>
        <p><strong>Parent ID:</strong> {asset.parentId ?? "No parent"}</p>
        <p><strong>Level:</strong> {asset.level}</p>
        <p><strong>Deleted:</strong> {asset.isDeleted ? "Yes" : "No"}</p>
      </div>

      {/* If the asset has childrens */}
      {asset.childrens && asset.childrens.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Child Assets</h2>

          <ul className="mt-2 space-y-2">
            {asset.childrens.map((child: any) => (
              <li
                key={child.assetId}
                className="border border-border p-3 rounded-md bg-muted/20"
              >
                <strong>{child.name}</strong> (ID: {child.assetId})
                <br />
                Level: {child.level}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
