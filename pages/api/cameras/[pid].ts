import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../../util/mysql';
import NextCors from 'nextjs-cors';

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
  const result = await mysql.query('SELECT * FROM cameras WHERE id = ?', [pid]);
  if (result.length > 0) {
    const camera = result[0];
    res.status(200).json(camera);
  } else {
    res.status(404).end('Camera ' + pid + ' could not be found');
  }
}

async function handleDELETE(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query;
  await mysql.query('DELETE FROM cameras WHERE id = ?', [pid]);
  res.status(200).end('success');
}
