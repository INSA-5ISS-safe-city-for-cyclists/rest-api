import { NextApiRequest, NextApiResponse } from 'next';
import criteria, { Criteria, DatabaseCriterion } from '../../types/criteria';
import mysql from '../../util/mysql';
import key from '../../constants/key';

function isPostDataValid(data: unknown): data is Criteria {
  const typedData = data as Criteria;
  return (
    typedData.min_speed != undefined ||
    typedData.max_distance != undefined ||
    typedData.min_speed_threshold != undefined ||
    typedData.min_distance_threshold != undefined
  );
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      await handleGET(req, res);
      break;
    case 'POST':
      await handlePOST(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

async function handleGET(_req: NextApiRequest, res: NextApiResponse) {
  const result: Criteria = criteria;
  const min_speed: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'min_speed'"
  );
  const max_distance: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'max_distance'"
  );
  const min_speed_threshold: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'min_speed_threshold'"
  );
  const min_distance_threshold: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'min_distance_threshold'"
  );
  if (
    min_speed.length != 0 &&
    max_distance.length != 0 &&
    min_speed_threshold.length != 0 &&
    min_distance_threshold.length != 0
  ) {
    result.min_speed = min_speed[0].value;
    result.max_distance = max_distance[0].value;
    result.min_speed_threshold = min_speed_threshold[0].value;
    result.min_distance_threshold = min_distance_threshold[0].value;
  } else {
    res.status(400).json('Criteria not found');
  }
  res.status(200).json(result);
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { body, headers } = req;
  if (headers.authorization === key) {
    if (isPostDataValid(body)) {
      if (body.min_speed != undefined) {
        criteria.min_speed = body.min_speed;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'min_speed'",
          criteria.min_speed
        );
      }

      if (body.max_distance != undefined) {
        criteria.max_distance = body.max_distance;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'max_distance'",
          criteria.max_distance
        );
      }

      if (body.min_speed_threshold != undefined) {
        criteria.min_speed_threshold = body.min_speed_threshold;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'min_speed_threshold'",
          criteria.min_speed_threshold
        );
      }

      if (body.min_distance_threshold != undefined) {
        criteria.min_distance_threshold = body.min_distance_threshold;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'min_distance_threshold'",
          criteria.min_distance_threshold
        );
      }

      // Update the database according to the current criteria
      // Dangerous reports
      await mysql.query(
        'UPDATE reports SET dangerous = true WHERE ((object_speed-bicycle_speed >= ? OR distance <= ?) AND object_speed-bicycle_speed >= ?  AND distance >= ?)',
        [
          criteria.min_speed,
          criteria.max_distance,
          criteria.min_speed_threshold,
          criteria.min_distance_threshold,
        ]
      );
      // Not dangerous reports
      await mysql.query(
        'UPDATE reports SET dangerous = false WHERE NOT((object_speed-bicycle_speed >= ? OR distance <= ?) AND object_speed-bicycle_speed >= ?  AND distance >= ?)',
        [
          criteria.min_speed,
          criteria.max_distance,
          criteria.min_speed_threshold,
          criteria.min_distance_threshold,
        ]
      );
      res.status(200).end('success');
    } else {
      res.status(400).end('Data provided invalid');
    }
  } else {
    res.status(400).end('Given API Key is invalid, verify Authorization');
  }
}
