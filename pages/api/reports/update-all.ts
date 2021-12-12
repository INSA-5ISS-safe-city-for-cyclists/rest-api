import { NextApiRequest, NextApiResponse } from 'next';
import criteria from '../../../constants/criteria';
import mysql from '../../../util/mysql';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      // Update the database according to the current criteria
      // Dangerous reports
      await mysql.query(
        'UPDATE reports SET dangerous = true WHERE (object_speed-bicycle_speed >= ? OR distance <= ?)',
        [criteria.min_speed, criteria.max_distance]
      );
      // Not dangerous reports
      await mysql.query(
        'UPDATE reports SET dangerous = false WHERE (object_speed-bicycle_speed < ? AND distance > ?)',
        [criteria.min_speed, criteria.max_distance]
      );
      res.status(200).end('success');
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
