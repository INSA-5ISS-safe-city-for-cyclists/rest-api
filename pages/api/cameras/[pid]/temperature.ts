// noinspection DuplicatedCode

import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../../../util/mysql';
import NextCors from 'nextjs-cors';

type Temperature = {
  temperature: number;
};

function isPostDataValid(data: unknown): data is number {
  return data != null;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  // Run the cors middleware
  // nextjs-cors uses the cors package, so we invite you to check the documentation https://github.com/expressjs/cors
  await NextCors(req, res, {
    // Options
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
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
  const result: Array<Temperature> = await mysql.query(
    'SELECT temperature FROM cameras WHERE id = ?',
    [pid]
  );
  if (result.length > 0) {
    const temperature = result[0].temperature;
    res.status(200).end(temperature.toString());
  } else {
    res.status(404).end('Camera ' + pid + ' could not be found');
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query;
  const { body } = req;
  if (!body) {
    res.status(400).end('No data provided');
  } else {
    if (isPostDataValid(body)) {
      const now = new Date().toLocaleString();
      await mysql.query(
        'UPDATE cameras SET temperature = ?, timestamp = ? WHERE id = ?',
        [body, now, pid]
      );
      res.status(200).end('success');
    } else {
      res.status(400).end('Data provided invalid');
    }
  }
}

async function handleDELETE(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query;
  await mysql.query('UPDATE cameras SET temperature = 0 WHERE id = ?', [pid]);
  res.status(200).end('success');
}
