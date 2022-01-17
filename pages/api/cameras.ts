import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';

export type Camera = {
  id: number;
  timestamp: string;
  counter: number;
  temperature: number;
};

function isPostDataValid(data: unknown): data is Camera {
  const typedData = data as Camera;
  return (
    typedData.timestamp != undefined &&
    typedData.counter != undefined &&
    typedData.temperature != undefined
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
  const result = await mysql.query('SELECT * FROM cameras ORDER BY id');
  res.status(200).json(result);
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { body } = req;
  if (isPostDataValid(body)) {
    await mysql.query(
      'INSERT INTO cameras (counter, timestamp, temperature) VALUES(?, ?, ?)',
      [body.counter, body.timestamp, body.temperature]
    );
    res.status(200).end('success');
  } else {
    res.status(400).end('Data provided invalid');
  }
}
