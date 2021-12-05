export type PostDangerReports = Array<POSTData>;

// Timestamp here refers to the complete timestamp
export type POSTData = {
  timestamp: number;
  distance: number;
  object_speed: number;
  bicycle_speed: number;
  latitude: number;
  longitude: number;
};
