const levelToType = (level: number): string => {
  switch (level) {
    case 1:
      return "Department";
    case 2:
      return "Line";
    case 3:
      return "Machine";
    case 4:
      return "SubMachine";
    default:
      return "Unknown";
  }
};

export default levelToType;
