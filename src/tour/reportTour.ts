export const reportTour = [
  {
    element: "#report-date",
    popover: {
      title: "Select Date",
      description: "Choose the date for which you want to generate the signal report.",
    },
  },
  {
    element: "#report-asset",
    popover: {
      title: "Select Asset",
      description: "Pick an asset to fetch its assigned device and generate the report.",
    },
  },
  {
    element: "#report-device",
    popover: {
      title: "Assigned Device",
      description:
        "This shows the device mapped to the selected asset. Report will be generated for this device.",
    },
  },
  {
    element: "#report-alerts",
    popover: {
      title: "Filter Alerts",
      description:
        "Enable this to show only readings crossing the defined alert threshold.",
    },
  },
  {
    element: "#generate-report-btn",
    popover: {
      title: "Generate Report",
      description:
        "Click to generate the daily signal report for the selected asset and date.",
    },
  },
  {
    element: "#download-csv-btn",
    popover: {
      title: "Download CSV",
      description: "Export the generated report in CSV format.",
    },
  },
  {
    element: "#download-pdf-btn",
    popover: {
      title: "Download PDF",
      description: "Export the generated report as a PDF with a formatted table.",
    },
  },
  {
    element: "#report-table",
    popover: {
      title: "Signal Report Table",
      description:
        "This table displays the generated signal data for the chosen asset and date. Alert values are highlighted.",
    },
  },
];
