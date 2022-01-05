import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';
import { secondsInOneDay } from '../../constants/reportTimeHourRange';

type CountReports = { 'COUNT(*)': 0 };

function isNumber(element: any): element is number {
  return !isNaN(element as number);
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      await handleGET(req, res);
      break;
    default:
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;
  let result: Array<CountReports>;

  let minTimestamp = 0;
  let maxTimestamp = secondsInOneDay;
  let dangerous = null;

  // Min hour criterion
  if (
    query.min_hour &&
    isNumber(query.min_hour) &&
    0 <= query.min_hour &&
    query.min_hour <= 24
  ) {
    minTimestamp = query.min_hour * 3600;
  }

  // Max hour criterion
  if (
    query.max_hour &&
    isNumber(query.max_hour) &&
    0 <= query.max_hour &&
    query.max_hour <= 24
  ) {
    maxTimestamp = query.max_hour * 3600;
  }

  // Dangerous criterion
  if (
    query.dangerous &&
    ['true', 'false', '1', '0'].includes(<string>query.dangerous)
  ) {
    dangerous = ['true', '1'].includes(<string>query.dangerous);
    result = await mysql.query(
      'SELECT COUNT(*) FROM reports WHERE dangerous = ? AND (? <= MOD(timestamp, ?) AND MOD(timestamp, ?) <= ?) ORDER BY id',
      [
        dangerous, // true or false
        minTimestamp,
        secondsInOneDay,
        secondsInOneDay,
        maxTimestamp,
      ]
    );
  } else {
    result = await mysql.query(
      'SELECT COUNT(*) FROM reports WHERE (? <= MOD(timestamp, ?) AND MOD(timestamp, ?) <= ?) ORDER BY id',
      [minTimestamp, secondsInOneDay, secondsInOneDay, maxTimestamp]
    );
  }

  const numberOfReports = result[0]['COUNT(*)'].toString();

  console.log(
    'Count' +
      (dangerous != null
        ? dangerous == true
          ? ' dangerous '
          : ' not dangerous '
        : ' all ') +
      'reports from ' +
      minTimestamp / 3600 +
      ':00 to ' +
      maxTimestamp / 3600 +
      ':00 : ' +
      numberOfReports +
      ' reports'
  );
  res.status(200).end(numberOfReports);
}
