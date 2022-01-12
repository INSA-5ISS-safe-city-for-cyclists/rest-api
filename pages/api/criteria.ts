import { NextApiRequest, NextApiResponse } from 'next';
import criteria, { Criteria, DatabaseCriterion } from '../../types/criteria';
import mysql from '../../util/mysql';
import key from '../../constants/key';

function isPostDataValid(data: unknown): data is Criteria {
  const typedData = data as Criteria;
  return (
    typedData.min_speed_threshold != undefined ||
    typedData.min_distance_threshold != undefined ||
    typedData.min_speed_0_1 != undefined ||
    typedData.min_speed_1_2 != undefined ||
    typedData.max_distance_0 != undefined ||
    typedData.max_distance_1 != undefined ||
    typedData.max_distance_2 != undefined
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
  const min_speed_threshold: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'min_speed_threshold'"
  );
  const min_distance_threshold: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'min_distance_threshold'"
  );
  const min_speed_0_1: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'min_speed_0_1'"
  );
  const min_speed_1_2: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'min_speed_1_2'"
  );
  const max_distance_0: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'max_distance_0'"
  );
  const max_distance_1: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'max_distance_1'"
  );
  const max_distance_2: Array<DatabaseCriterion> = await mysql.query(
    "SELECT value FROM criteria WHERE name = 'max_distance_2'"
  );
  if (
    min_speed_threshold.length != 0 &&
    min_distance_threshold.length != 0 &&
    min_speed_0_1.length != 0 &&
    min_speed_1_2.length != 0 &&
    max_distance_0.length != 0 &&
    max_distance_1.length != 0 &&
    max_distance_2.length != 0
  ) {
    result.min_speed_threshold = min_speed_threshold[0].value;
    result.min_distance_threshold = min_distance_threshold[0].value;
    result.min_speed_0_1 = min_speed_0_1[0].value;
    result.min_speed_1_2 = min_speed_1_2[0].value;
    result.max_distance_0 = max_distance_0[0].value;
    result.max_distance_1 = max_distance_1[0].value;
    result.max_distance_2 = max_distance_2[0].value;
  } else {
    res.status(400).json('Criteria not found');
  }
  res.status(200).json(result);
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { body, headers } = req;
  if (headers.authorization === key) {
    if (isPostDataValid(body)) {
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

      if (body.min_speed_0_1 != undefined) {
        criteria.min_speed_0_1 = body.min_speed_0_1;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'min_speed_0_1'",
          criteria.min_speed_0_1
        );
      }

      if (body.min_speed_1_2 != undefined) {
        criteria.min_speed_1_2 = body.min_speed_1_2;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'min_speed_1_2'",
          criteria.min_speed_1_2
        );
      }

      if (body.max_distance_0 != undefined) {
        criteria.max_distance_0 = body.max_distance_0;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'max_distance_0'",
          criteria.max_distance_0
        );
      }

      if (body.max_distance_1 != undefined) {
        criteria.max_distance_1 = body.max_distance_1;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'max_distance_1'",
          criteria.max_distance_1
        );
      }

      if (body.max_distance_2 != undefined) {
        criteria.max_distance_2 = body.max_distance_2;
        await mysql.query(
          "UPDATE criteria SET value = ? WHERE name = 'max_distance_2'",
          criteria.max_distance_2
        );
      }
      // Update the database according to the current criteria
      // Dangerous reports
      await mysql.query(
        'UPDATE reports SET dangerous = true WHERE ((distance <= ? OR (distance <= ? AND ABS(object_speed-bicycle_speed) >= ?) OR (distance <= ? AND ABS(object_speed-bicycle_speed) >= ?)) AND ABS(object_speed-bicycle_speed) >= ?  AND distance >= ?)',
        [
          criteria.max_distance_0,
          criteria.max_distance_1,
          criteria.min_speed_0_1,
          criteria.max_distance_2,
          criteria.min_speed_1_2,
          criteria.min_speed_threshold,
          criteria.min_distance_threshold,
        ]
      );
      // Not dangerous reports
      await mysql.query(
        'UPDATE reports SET dangerous = false WHERE NOT((distance <= ? OR (distance <= ? AND ABS(object_speed-bicycle_speed) >= ?) OR (distance <= ? AND ABS(object_speed-bicycle_speed) >= ?)) AND ABS(object_speed-bicycle_speed) >= ?  AND distance >= ?)',
        [
          criteria.max_distance_0,
          criteria.max_distance_1,
          criteria.min_speed_0_1,
          criteria.max_distance_2,
          criteria.min_speed_1_2,
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
