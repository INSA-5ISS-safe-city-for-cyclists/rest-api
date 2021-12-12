import type { NextApiRequest, NextApiResponse } from 'next';
import { PostDangerReports, POSTData } from '../../types/api';
import criteria from '../../constants/criteria';
import mysql from '../../util/mysql';

function isPostDataValid(data: unknown): data is POSTData {
  const typedData = data as POSTData;
  return (
    typedData.object_speed != undefined &&
    typedData.longitude != undefined &&
    typedData.latitude != undefined &&
    typedData.bicycle_speed != undefined &&
    typedData.distance != undefined &&
    typedData.timestamp != undefined
  );
}

function isPostDataArrayValid(data: unknown): data is PostDangerReports {
  return (
    Array.isArray(data) && (data as PostDangerReports).every(isPostDataValid)
  );
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'POST':
      await handlePOST(req, res);
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
    if (isPostDataArrayValid(body)) {
      body.forEach((d) => {
        mysql.query(
          'INSERT INTO reports (timestamp, distance, object_speed, bicycle_speed, latitude, longitude, dangerous) VALUES(?, ?, ?, ?, ?, ?, ?)',
          [
            d.timestamp,
            d.distance,
            d.object_speed,
            d.bicycle_speed,
            d.latitude,
            d.longitude,
            d.object_speed - d.bicycle_speed >= criteria.min_speed ||
              d.distance <= criteria.max_distance,
          ]
        );
      });
      res.status(200).end('success');
    } else {
      res.status(400).end('Data provided invalid');
    }
  }
}
