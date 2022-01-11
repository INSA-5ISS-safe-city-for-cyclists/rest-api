import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';
import criteria from '../../types/criteria';

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

/* eslint-disable @typescript-eslint/no-explicit-any */
function isPostDataValid(data: any) {
  let ok = true;
  // ok = ok && gjv.valid(data);
  const features = data?.features;
  ok = ok && data?.features != undefined;
  if (ok) {
    for (const feature of features) {
      const properties = feature.properties;
      ok =
        ok &&
        properties?.timestamp != undefined &&
        properties?.distance != undefined &&
        properties?.object_speed != undefined &&
        properties?.bicycle_speed != undefined;
    }
  }
  return ok;
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
      await handleDELETE(req, res);
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
    if (isPostDataValid(body)) {
      const features = body.features;
      for (const feature of features) {
        const properties = feature.properties;
        const latitude = feature.geometry.coordinates[1];
        const longitude = feature.geometry.coordinates[0];
        const relative_speed =
          properties.object_speed - properties.bicycle_speed;
        await mysql.query(
          'INSERT INTO reports (timestamp, distance, object_speed, bicycle_speed, latitude, longitude, dangerous) VALUES(?, ?, ?, ?, ?, ?, ?)',
          [
            properties.timestamp,
            properties.distance,
            properties.object_speed,
            properties.bicycle_speed,
            latitude,
            longitude,
            (relative_speed >= criteria.min_speed ||
              properties.distance <= criteria.max_distance) &&
              relative_speed >= criteria.min_speed_threshold &&
              properties.distance >= criteria.min_distance_threshold,
          ]
        );
      }
      res.status(200).end('success');
    } else {
      res.status(400).end('Data provided invalid');
    }
  }
}

async function handleDELETE(req: NextApiRequest, res: NextApiResponse) {
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
