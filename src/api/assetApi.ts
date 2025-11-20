const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function getAssetHierarchy() {
  await wait(300); // mock API delay

  return [
    {
      assetId: "dept-1",
      name: "Manufacturing Plant",
      level: 1,
      isDeleted: false,
      childrens: [
        {
          assetId: "line-1",
          name: "Assembly Line A",
          level: 2,
          isDeleted: false,
          childrens: [
            {
              assetId: "machine-1",
              name: "Hydraulic Press",
              level: 3,
              isDeleted: false,
              childrens: [
                {
                  assetId: "sub-1",
                  name: "Pressure Sensor",
                  level: 4,
                  isDeleted: false,
                  childrens: [],
                },
                {
                  assetId: "sub-2",
                  name: "Cooling Unit",
                  level: 4,
                  isDeleted: false,
                  childrens: [],
                },
              ],
            },
            {
              assetId: "machine-2",
              name: "Welding Robot",
              level: 3,
              isDeleted: false,
              childrens: [
                {
                  assetId: "sub-3",
                  name: "Weld Nozzle",
                  level: 4,
                  isDeleted: false,
                  childrens: [],
                },
              ],
            },
          ],
        },

        {
          assetId: "line-2",
          name: "Assembly Line B",
          level: 2,
          isDeleted: false,
          childrens: [
            {
              assetId: "machine-3",
              name: "CNC Machine",
              level: 3,
              isDeleted: false,
              childrens: [],
            },
          ],
        },
      ],
    },
  ];
}