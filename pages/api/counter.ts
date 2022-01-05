import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';

type Counter = {
  counter: number;
};

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
  const result: Array<Counter> = await mysql.query(
    'SELECT counter FROM counter WHERE id = 1'
  );
  const counter = result[0].counter;
  res.status(200).end(counter.toString());
}

async function handlePOST(_req: NextApiRequest, res: NextApiResponse) {
  await mysql.query('UPDATE counter SET counter = counter + 1 WHERE id = 1');
  res.status(200).end('success');
}

async function handleDELETE(_req: NextApiRequest, res: NextApiResponse) {
  await mysql.query('UPDATE counter SET counter = 0 WHERE id = 1');
  res.status(200).end('success');
}
