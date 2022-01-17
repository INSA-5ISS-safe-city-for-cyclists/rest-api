import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../../../util/mysql';

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

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query;
  const result: Array<Counter> = await mysql.query(
    'SELECT counter FROM cameras WHERE id = ?',
    [pid]
  );
  if (result.length > 0) {
    const counter = result[0].counter;
    res.status(200).end(counter.toString());
  } else {
    res.status(404).end('Camera ' + pid + ' could not be found');
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query;
  await mysql.query('UPDATE cameras SET counter = counter + 1 WHERE id = ?', [
    pid,
  ]);
  res.status(200).end('success');
}

async function handleDELETE(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query;
  await mysql.query('UPDATE cameras SET counter = 0 WHERE id = ?', [pid]);
  res.status(200).end('success');
}
