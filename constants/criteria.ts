export type Criteria = {
  // Default criteria to set a report as dangerous
  min_speed: number; // When relativeSpeed=(objectSpeed-bicycleSpeed) is greater than this criteria (in km/h)
  max_distance: number; // When distance is smaller than this criteria (in cm)
};

export type DatabaseCriterion = {
  name: string;
  value: number;
};

export default {
  // Default criteria to set a report as dangerous
  min_speed: 30.0, // When relativeSpeed=(objectSpeed-bicycleSpeed) is greater than this criteria (in km/h)
  max_distance: 100.0, // When distance is smaller than this criteria (in cm)
};
