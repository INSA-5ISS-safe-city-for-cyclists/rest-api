import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';
import criteria from '../../types/criteria';
import { object } from 'prop-types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const gjv = require('geojson-validation');

// function isPostDataValid(data: unknown): data is POSTData {
//   const typedData = data as POSTData;
//   return (
//     typedData.object_speed != undefined &&
//     typedData.longitude != undefined &&
//     typedData.latitude != undefined &&
//     typedData.bicycle_speed != undefined &&
//     typedData.distance != undefined &&
//     typedData.timestamp != undefined
//   );
// }
//
// function isPostDataArrayValid(data: unknown): data is PostDangerReports {
//   return (
//     Array.isArray(data) && (data as PostDangerReports).every(isPostDataValid)
//   );
// }

function isPostDataValid(data: string) {
  return gjv.valid(JSON.parse(JSON.stringify(data)), true);
}

function isDeleteDataValid(data: unknown): data is Array<number> {
  return (
    Array.isArray(data) &&
    (data as Array<number>).every((i) => typeof i === 'number')
  );
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'POST':
      await handlePOST(req, res);
      break;
    case 'DELETE':
      await handleDelete(req, res);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { body } = req;
  if (!body) {
    res.status(400).end('No data provided');
  } else {
    // if (isPostDataArrayValid(body)) {
    //   body.forEach((d) => {
    //     mysql.query(
    //       'INSERT INTO reports (timestamp, distance, object_speed, bicycle_speed, latitude, longitude, dangerous) VALUES(?, ?, ?, ?, ?, ?, ?)',
    //       [
    //         d.timestamp,
    //         d.distance,
    //         d.object_speed,
    //         d.bicycle_speed,
    //         d.latitude,
    //         d.longitude,
    //         d.object_speed - d.bicycle_speed >= criteria.min_speed ||
    //           d.distance <= criteria.max_distance,
    //       ]
    //     );
    //   });
    const data = JSON.stringify(body);
    if (isPostDataValid(data)) {
      const features = JSON.parse(data).features;
      for (const feature of features) {
        const properties = feature.properties;
        const latitude = feature.geometry.coordinates[1];
        const longitude = feature.geometry.coordinates[0];
        await mysql.query(
          'INSERT INTO reports (timestamp, distance, object_speed, bicycle_speed, latitude, longitude, dangerous) VALUES(?, ?, ?, ?, ?, ?, ?)',
          [
            // TODO check timestamp format (seconds)
            properties.timestamp / 1000,
            properties.distance,
            properties.object_speed,
            properties.bicycle_speed,
            latitude,
            longitude,
            properties.object_speed - properties.bicycle_speed >=
              criteria.min_speed ||
              properties.distance <= criteria.max_distance,
          ]
        );
      }
      res.status(200).end('success');
    } else {
      res.status(400).end('Data provided invalid');
    }
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { body } = req;
  if (isDeleteDataValid(body)) {
    body.forEach((id) => {
      mysql.query('DELETE FROM reports WHERE id = ?', [id]);
    });
    res.status(200).end('success');
  } else {
    res.status(400).end('Data provided invalid');
  }
}
