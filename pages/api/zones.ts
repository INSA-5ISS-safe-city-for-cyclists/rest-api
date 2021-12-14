import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';
import gjv from 'geojson-validation';
import { DatabaseData } from '../../types/api';

//TODO calibrate
const radius = 0.015; // ~=1.6698 km

function getDistance(report1: DatabaseData, report2: DatabaseData): number {
  return Math.sqrt(
    Math.pow(report2.latitude - report1.latitude, 2) +
      Math.pow(report2.longitude - report1.longitude, 2)
  );
}

function isGetResponseDataValid(geoJson: object) {
  return gjv.valid(geoJson);
}

function generateGeoJson(result: string) {
  const features = [];
  // JSON.parse(JSON.stringify(result)).forEach((v) => {
  //   features.push({
  //     geometry: {
  //       coordinates: [v.longitude, v.latitude, 0.0],
  //       type: 'Point',
  //     },
  //     properties: {
  //       id: v.id,
  //       bicycle_speed: v.bicycle_speed,
  //       object_speed: v.object_speed,
  //       distance: v.distance,
  //       dangerous: v.dangerous,
  //       timestamp: v.timestamp * 1000,
  //     },
  //     type: 'Feature',
  //   });
  // });
  const reportList: Array<DatabaseData> = JSON.parse(JSON.stringify(result));
  while (reportList.length > 0) {
    // Center report is the first element
    const centerReport = reportList[0];
    console.log('Center report : ');
    console.log(centerReport);

    // Remove center report from the list
    reportList.splice(0, 1);

    // Get the nearby reports that are within the given radius
    const nearbyReports = reportList.filter(
      (report) => getDistance(report, centerReport) < radius
    );

    // Total number of reports in this zone
    const numberOfReports = 1 + nearbyReports.length;

    // Add the zone to the feature collection
    features.push({
      geometry: {
        coordinates: [centerReport.longitude, centerReport.latitude, 0.0],
        type: 'Point',
      },
      properties: {
        mag: numberOfReports,
      },
      type: 'Feature',
    });

    // Remove the reports that were found within the given radius
    nearbyReports.forEach((value) => {
      const index = reportList.indexOf(value);
      reportList.splice(index, 1);
    });
  }
  return {
    type: 'FeatureCollection',
    features: features,
  };
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

// TODO convert into zones
async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;
  let result: string;
  // Generate the timestamp of the date 3 months ago
  const threeMonthsAgoDate = new Date();
  threeMonthsAgoDate.setMonth(threeMonthsAgoDate.getMonth() - 3);
  const threeMonthsAgoTimestamp = Math.round(
    threeMonthsAgoDate.getTime() / 1000
  );
  // Dangerous criterion
  if (
    query.dangerous &&
    ['true', 'false', '1', '0'].includes(<string>query.dangerous)
  ) {
    const dangerous = ['true', '1'].includes(<string>query.dangerous);
    result = await mysql.query(
      'SELECT * FROM reports WHERE dangerous = ? AND timestamp > ?',
      [
        dangerous, // true or false
        threeMonthsAgoTimestamp, // Use only the reports less than 3 months old
      ]
    );
  } else {
    result = await mysql.query(
      'SELECT * FROM reports WHERE timestamp > ?',
      threeMonthsAgoTimestamp // Use only the reports less than 3 months old
    );
  }
  const geoJson = generateGeoJson(result);
  if (isGetResponseDataValid(geoJson)) {
    res.status(200).json(geoJson);
  } else {
    res.status(400).end('Error while creating geoJson');
  }
}
