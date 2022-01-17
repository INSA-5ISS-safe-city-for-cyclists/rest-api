import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../../util/mysql';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
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
