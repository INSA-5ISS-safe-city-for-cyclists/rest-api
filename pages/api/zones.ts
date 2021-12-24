import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';
import gjv from 'geojson-validation';
import monthsOld from '../../constants/monthsOld';
import reportTimeHourRange from '../../constants/reportTimeHourRange';
import * as dbscan from '@turf/clusters-dbscan';
import * as turfHelpers from '@turf/helpers';
import * as centroid from '@turf/centroid';
import { FeatureCollection, Point } from '@turf/helpers';
import { Feature } from 'geojson';
import { MinMaxTimestampData } from '../../types/api';

const dbscanMaxDistance = 0.018;
const dbscanMinPoints = 2;

const minPoints = 1;
const radius = 0.0002565 / 2;

// Generate the timestamp of the date 3 months ago (by default)
const nMonthsAgoDate = new Date();
nMonthsAgoDate.setMonth(nMonthsAgoDate.getMonth() - monthsOld);
const nMonthsAgoTimestamp = Math.round(nMonthsAgoDate.getTime() / 1000);

const secondsInOneDay = 86400;

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

function getDistance(report1: Feature<Point>, report2: Feature<Point>): number {
  return Math.sqrt(
    Math.pow(
      report2.geometry.coordinates[1] - report1.geometry.coordinates[1],
      2
    ) +
      Math.pow(
        report2.geometry.coordinates[0] - report1.geometry.coordinates[0],
        2
      )
  );
}

// % operator can return negative values => we want the real modulo : positive
function positiveMod(i1: number, i2: number): number {
  const rem = i1 % i2;
  return rem >= 0 ? rem : i2 + rem;
}

function getOptimalCenterReport(
  featureCollection: FeatureCollection<Point>
): Feature<Point> {
  if (featureCollection.features.length === 0) {
    return null;
  }

  let optimalCenterReport = featureCollection.features[0];
  let maxPointsWithinRadius = 0;

  for (const centerReport of featureCollection.features) {
    // const nbPointsWithinRadius = turf.pointsWithinPolygon(
    //   featureCollection,
    //   turf.buffer(report, radius, { units: 'degrees' })
    // ).features.length;
    // Get the nearby reports that are within the given radius
    const nbPointsWithinRadius = featureCollection.features.filter(
      (report) => getDistance(report, centerReport) < radius
    ).length;

    if (nbPointsWithinRadius > maxPointsWithinRadius) {
      optimalCenterReport = centerReport;
      maxPointsWithinRadius = nbPointsWithinRadius;
    }
  }

  return optimalCenterReport;
}

function simpleCluster(result: string, optimizeCenterReport = false) {
  const label =
    'Simple cluster ' + (optimizeCenterReport ? 'optimized' : 'not optimized');
  console.time(label);

  const zones = turfHelpers.featureCollection([]);
  const rawFeatures = databaseToGeojson(result) as FeatureCollection<Point>;

  while (rawFeatures.features.length > 0) {
    const centerReport = optimizeCenterReport
      ? // Get the optimal center report (max points within radius)
        getOptimalCenterReport(rawFeatures)
      : // // Center report is the first element
        rawFeatures.features[0];

    // const nearbyReports = turf.pointsWithinPolygon(
    //   rawFeatures,
    //   turf.buffer(centerReport, radius, { units: 'degrees' })
    // );

    const nearbyReports = rawFeatures.features.filter(
      (report) => getDistance(report, centerReport) < radius
    );

    // console.log('Using Buffer');
    // nearbyReports.features.forEach((value) => console.log(value));

    // Remove the reports that were found within the given radius
    nearbyReports.forEach((value) => {
      const index = rawFeatures.features.indexOf(value);
      rawFeatures.features.splice(index, 1);
    });

    // Ignore small zones (egs: single reports)
    if (nearbyReports.length < minPoints) {
      continue;
    }
    const centerZone = turfHelpers.feature(
      turfHelpers.geometry('Point', centerReport.geometry.coordinates)
    );

    // Magnitude = number of reports
    centerZone.properties.mag = nearbyReports.length;

    let recentness = 0;
    nearbyReports.forEach((feature) => {
      recentness += feature.properties.timestamp;
    });
    // Average timestamp of the reports in the cluster
    recentness = recentness / nearbyReports.length;

    // Recentness between 0 and 1 according to (nowTimestamp - nMonthsAgoTimestamp)
    const nowTimestamp = Math.round(new Date().getTime() / 1000);
    recentness =
      1 - (nowTimestamp - recentness) / (nowTimestamp - nMonthsAgoTimestamp);

    centerZone.properties.recentness = recentness;

    zones.features.push(centerZone);
  }
  console.timeEnd(label);
  return zones;
}

function turfCluster(result: string) {
  const label = 'Turf cluster';
  console.time(label);
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

    // Magnitude = number of reports
    myCentroid.properties.mag = featureCollection.features.length;

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

    myCentroid.properties.recentness = recentness;

    zones.features.push(myCentroid);
  });
  console.timeEnd(label);
  return zones;
}

// Generate zones according to current time (+/- 1h) and day

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

function isGetResponseDataValid(geoJson: object) {
  return gjv.valid(geoJson);
}

function generateGeoJson(result: string) {
  return simpleCluster(result, true);
  // return turfCluster(result);
}

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
