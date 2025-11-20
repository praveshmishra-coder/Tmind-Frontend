export function mapBackendAsset(item: any): Asset {
  const levelTypeMap: Record<number, Asset["type"]> = {
    1: "Department",
    2: "Line",
    3: "Machine",
    4: "SubMachine",
  };

  return {
    id: item.assetId,
    name: item.name,
    type: levelTypeMap[item.level] || "Department",
    depth: item.level,
    isDeleted: item.isDeleted,
    children: item.childrens?.map(mapBackendAsset) || [],
  };
}
