import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';
import gjv from 'geojson-validation';
import monthsOld from '../../constants/monthsOld';
import reportTimeHourRange from '../../constants/reportTimeHourRange';
import * as dbscan from '@turf/clusters-dbscan';
import * as turf from '@turf/turf';
import * as turfHelpers from '@turf/helpers';
import * as centroid from '@turf/centroid';
import { FeatureCollection, Point } from '@turf/helpers';
import { Feature } from 'geojson';

//TODO calibrate
const dbscanMaxDistance = 0.018;
const dbscanMinPoints = 2;

const minPoints = 1;
const radius = 0.0002565 / 2;

// Generate the timestamp of the date 3 months ago (by default)
const nMonthsAgoDate = new Date();
nMonthsAgoDate.setMonth(nMonthsAgoDate.getMonth() - monthsOld);
const nMonthsAgoTimestamp = Math.round(nMonthsAgoDate.getTime() / 1000);

function isGetResponseDataValid(geoJson: object) {
  return gjv.valid(geoJson);
}

function databaseToGeojson(result: string) {
  const features = [];
  JSON.parse(JSON.stringify(result)).forEach((v) => {
    features.push({
      geometry: {
        coordinates: [v.longitude, v.latitude, 0.0],
        type: 'Point',
      },
      properties: {
        id: v.id,
        bicycle_speed: v.bicycle_speed,
        object_speed: v.object_speed,
        distance: v.distance,
        dangerous: v.dangerous,
        timestamp: v.timestamp,
      },
      type: 'Feature',
    });
  });
  return {
    type: 'FeatureCollection',
    features: features,
  };
}

function getOptimalCenterReport(
  featureCollection: FeatureCollection<Point>
): Feature<Point> {
  if (featureCollection.features.length === 0) {
    return null;
  }

  let optimalCenterReport = featureCollection.features[0];
  let maxPointsWithinRadius = turf.pointsWithinPolygon(
    featureCollection,
    turf.buffer(optimalCenterReport, radius, { units: 'degrees' })
  ).features.length;

  for (const report of featureCollection.features) {
    const nbPointsWithinRadius = turf.pointsWithinPolygon(
      featureCollection,
      turf.buffer(report, radius, { units: 'degrees' })
    ).features.length;
    if (nbPointsWithinRadius > maxPointsWithinRadius) {
      optimalCenterReport = report;
      maxPointsWithinRadius = nbPointsWithinRadius;
    }
  }

  return optimalCenterReport;
}

function processCenterZone(
  centerZone: Feature,
  featureCollection: FeatureCollection
) {
  // Magnitude = number of reports
  centerZone.properties.mag = featureCollection.features.length;

  let recentness = 0;
  featureCollection.features.forEach((feature) => {
    recentness += feature.properties.timestamp;
  });
  // Average timestamp of the reports in the cluster
  recentness = recentness / featureCollection.features.length;

  // Recentness between 0 and 1 according to (nowTimestamp - nMonthsAgoTimestamp)
  const nowTimestamp = Math.round(new Date().getTime() / 1000);
  recentness =
    1 - (nowTimestamp - recentness) / (nowTimestamp - nMonthsAgoTimestamp);

  centerZone.properties.recentness = recentness;
}

function simpleCluster(result: string) {
  const start = Date.now();
  const zones = turfHelpers.featureCollection([]);
  const rawFeatures = databaseToGeojson(result) as FeatureCollection<Point>;

  while (rawFeatures.features.length > 0) {
    // // Center report is the first element
    // const centerReport = rawFeatures.features[0];

    // Get the optimal center report (max points within radius)
    const centerReport = getOptimalCenterReport(rawFeatures);

    const nearbyReports = turf.pointsWithinPolygon(
      rawFeatures,
      turf.buffer(centerReport, radius, { units: 'degrees' })
    );

    // console.log('Using Buffer');
    // nearbyReports.features.forEach((value) => console.log(value));

    // Remove the reports that were found within the given radius
    nearbyReports.features.forEach((value) => {
      const index = rawFeatures.features.indexOf(value);
      rawFeatures.features.splice(index, 1);
    });

    // Ignore small zones (egs: single reports)
    if (nearbyReports.features.length < minPoints) {
      continue;
    }
    const centerZone = turfHelpers.feature(
      turfHelpers.geometry('Point', centerReport.geometry.coordinates)
    );

    processCenterZone(centerZone, nearbyReports);

    zones.features.push(centerZone);
  }
  const end = Date.now();
  console.log('Elapsed time: ' + (end - start) + ' ms');
  return zones;
}

function turfCluster(result: string) {
  const start = Date.now();
  // Clusterise using DBSCAN
  const clustered = dbscan.default(
    databaseToGeojson(result) as FeatureCollection<Point>,
    dbscanMaxDistance,
    {
      minPoints: dbscanMinPoints,
    }
  );
  const clusters = new Map<number, FeatureCollection<Point>>();
  // Retrieve the clusters
  for (const feature of clustered.features) {
    // Ignore noise
    if (feature.properties.dbscan === 'core') {
      if (!clusters.has(feature.properties.cluster)) {
        clusters.set(
          feature.properties.cluster,
          turfHelpers.featureCollection([])
        );
      }
      clusters.get(feature.properties.cluster).features.push(feature);
    }
  }

  // Transform clusters into zones
  const zones = turfHelpers.featureCollection([]);
  clusters.forEach((featureCollection) => {
    const myCentroid = centroid.default(featureCollection);

    processCenterZone(myCentroid, featureCollection);

    zones.features.push(myCentroid);
  });
  const end = Date.now();
  console.log('Elapsed time: ' + (end - start) + ' ms');
  return zones;
}

function generateGeoJson(result: string) {
  return simpleCluster(result);
  // return turfCluster(result);
}

interface MinMaxTimestampData {
  min: number;
  max: number;
  operator: 'AND' | 'OR';
}

// % operator can return negative values => we want the real modulo : positive
function positiveMod(i1: number, i2: number): number {
  const rem = i1 % i2;
  return rem >= 0 ? rem : i2 + rem;
}

const secondsInOneDay = 86400;

function getMinMaxTimestampData(): MinMaxTimestampData {
  const now = new Date();

  // Testing
  // TODO Remove this line used to test
  // now.setHours(9);

  // Current time of day (in seconds)
  const timeOfDay = Math.round(now.getTime() / 1000) % secondsInOneDay;

  const result: MinMaxTimestampData = {
    min: 0,
    max: 0,
    operator: 'AND',
  };

  const secondsInOneHour = 3600;
  // Example with reportTimeHourRange == 1
  // TimeOfDay < 1am
  if (timeOfDay - secondsInOneHour * reportTimeHourRange < 0) {
    result.max = timeOfDay + secondsInOneHour * reportTimeHourRange;
    result.min = positiveMod(
      timeOfDay - secondsInOneHour * reportTimeHourRange,
      secondsInOneDay
    );
    result.operator = 'OR';
  }
  // TimeOfDay > 11pm
  else if (
    timeOfDay + secondsInOneHour * reportTimeHourRange >
    secondsInOneDay
  ) {
    result.min = timeOfDay - secondsInOneHour * reportTimeHourRange;
    result.max = positiveMod(
      timeOfDay + secondsInOneHour * reportTimeHourRange,
      secondsInOneDay
    );
    result.operator = 'OR';
  }
  // 1am < TimeOfDay < 11pm
  else {
    result.min = timeOfDay - secondsInOneHour * reportTimeHourRange;
    result.max = timeOfDay + secondsInOneHour * reportTimeHourRange;
    result.operator = 'AND';
  }

  // console.log(result);

  return result;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      await handleGET(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;
  let result: string;

  // Get the min and max timestamp to get the reports according to current time of day (+/- 1h by default)
  // And also the operator : when the time interval goes past midnight we have to change AND to OR
  const minMaxTimestamp = getMinMaxTimestampData();

  // Dangerous criterion
  if (
    query.dangerous &&
    ['true', 'false', '1', '0'].includes(<string>query.dangerous)
  ) {
    const dangerous = ['true', '1'].includes(<string>query.dangerous);
    switch (minMaxTimestamp.operator) {
      case 'AND':
        result = await mysql.query(
          'SELECT * FROM reports WHERE dangerous = ? AND timestamp > ? AND (? <= MOD(timestamp, ?) AND MOD(timestamp, ?) <= ?) ORDER BY id',
          [
            dangerous, // true or false
            nMonthsAgoTimestamp, // Use only the reports less than 3 months old
            minMaxTimestamp.min,
            secondsInOneDay,
            secondsInOneDay,
            minMaxTimestamp.max,
          ]
        );
        break;
      case 'OR':
        result = await mysql.query(
          'SELECT * FROM reports WHERE dangerous = ? AND timestamp > ? AND (? <= MOD(timestamp, ?) OR MOD(timestamp, ?) <= ?) ORDER BY id',
          [
            dangerous, // true or false
            nMonthsAgoTimestamp, // Use only the reports less than 3 months old
            minMaxTimestamp.min,
            secondsInOneDay,
            secondsInOneDay,
            minMaxTimestamp.max,
          ]
        );
        break;
    }
  } else {
    switch (minMaxTimestamp.operator) {
      case 'AND':
        result = await mysql.query(
          'SELECT * FROM reports WHERE timestamp > ? AND (? <= MOD(timestamp, ?) AND MOD(timestamp, ?) <= ?) ORDER BY id',
          [
            nMonthsAgoTimestamp, // Use only the reports less than 3 months old
            minMaxTimestamp.min,
            secondsInOneDay,
            secondsInOneDay,
            minMaxTimestamp.max,
          ]
        );
        break;
      case 'OR':
        result = await mysql.query(
          'SELECT * FROM reports WHERE timestamp > ? AND (? <= MOD(timestamp, ?) OR MOD(timestamp, ?) <= ?) ORDER BY id',
          [
            nMonthsAgoTimestamp, // Use only the reports less than 3 months old
            minMaxTimestamp.min,
            secondsInOneDay,
            secondsInOneDay,
            minMaxTimestamp.max,
          ]
        );
        break;
    }
  }
  const geoJson = generateGeoJson(result);
  if (isGetResponseDataValid(geoJson)) {
    res.status(200).json(geoJson);
  } else {
    res.status(400).end('Error while creating geoJson');
  }
}
