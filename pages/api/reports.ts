import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../constants/db';
import { PostDangerReports, POSTData } from '../../types/api';
import criteria from '../../constants/criteria';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mysql = require('serverless-mysql')({
  config: db,
});

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

function isDeleteDataValid(data: unknown): data is Array<number> {
  return (
    Array.isArray(data) &&
    (data as Array<number>).every((i) => typeof i === 'number')
  );
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, body } = req;
  switch (method) {
    case 'GET':
      let result = '';
      if (
        req.query.dangerous &&
        ['true', 'false', '1', '0'].includes(<string>req.query.dangerous)
      ) {
        const dangerous = ['true', '1'].includes(<string>req.query.dangerous);
        result = await mysql.query(
          'SELECT * FROM reports WHERE dangerous = ?',
          dangerous // true or false
        );
      } else {
        result = await mysql.query('SELECT * FROM reports');
      }
      res.status(200).json(result);
      break;
    case 'DELETE':
      if (isDeleteDataValid(body)) {
        body.forEach((id) => {
          mysql.query('DELETE FROM reports WHERE id = ?', [id]);
        });
        res.status(200).end('success');
      } else {
        res.status(400).end('Data provided invalid');
      }
      break;
    case 'POST':
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
                d.object_speed - d.bicycle_speed >= criteria.minSpeed ||
                  d.distance <= criteria.maxDistance,
              ]
            );
          });
          res.status(200).end('success');
        } else {
          res.status(400).end('Data provided invalid');
        }
      }
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
