export type Criteria = {
  // Default criteria to set a report as dangerous
  min_speed_threshold: number; // Minimal speed threshold used to remove false positive reports (in km/h)
  min_distance_threshold: number; // Minimal distance threshold used to remove false positive reports (in cm)
  min_speed_0_1: number; // When relativeSpeed=(objectSpeed-bicycleSpeed) is greater than this criteria (in km/h) and distance is between max_distance_0 and max_distance_1
  min_speed_1_2: number; // When relativeSpeed=(objectSpeed-bicycleSpeed) is greater than this criteria (in km/h) and distance is between max_distance_1 and max_distance_2
  max_distance_0: number; // When distance is smaller than this criteria (in cm)
  max_distance_1: number;
  max_distance_2: number;
};

export type DatabaseCriterion = {
  name: string;
  value: number;
};

export default {
  // Default criteria to set a report as dangerous
  min_speed_threshold: 5.0, // Minimal speed threshold used to remove false positive reports (in km/h)
  min_distance_threshold: 50, // Minimal distance threshold used to remove false positive reports (in cm)
  min_speed_0_1: 30.0, // When relativeSpeed=(objectSpeed-bicycleSpeed) is greater than this criteria (in km/h) and distance is between max_distance_0 and max_distance_1
  min_speed_1_2: 80.0, // When relativeSpeed=(objectSpeed-bicycleSpeed) is greater than this criteria (in km/h) and distance is between max_distance_1 and max_distance_2
  max_distance_0: 100.0, // When distance is smaller than this criteria (in cm)
  max_distance_1: 350.0,
  max_distance_2: 700.0,
};
