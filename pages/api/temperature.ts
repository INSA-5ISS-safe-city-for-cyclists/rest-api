import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';

type Temperature = {
  temperature: number;
};

function isPostDataValid(data: unknown): data is number {
  return data != null;
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
    case 'DELETE':
      await handleDELETE(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

async function handleGET(_req: NextApiRequest, res: NextApiResponse) {
  const result: Array<Temperature> = await mysql.query(
    'SELECT temperature FROM temperature WHERE id = 1'
  );
  const counter = result[0].temperature;
  res.status(200).end(counter.toString());
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { body } = req;
  if (!body) {
    res.status(400).end('No data provided');
  } else {
    if (isPostDataValid(body)) {
      await mysql.query(
        'UPDATE temperature SET temperature = ? WHERE id = 1',
        body
      );
      res.status(200).end('success');
    } else {
      res.status(400).end('Data provided invalid');
    }
  }
}

async function handleDELETE(_req: NextApiRequest, res: NextApiResponse) {
  await mysql.query('UPDATE temperature SET temperature = 0 WHERE id = 1');
  res.status(200).end('success');
}
