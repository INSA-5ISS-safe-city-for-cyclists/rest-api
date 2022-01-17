import { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../../../util/mysql';

type Timestamp = {
  timestamp: string;
};

function isPostDataValid(data: unknown): data is string {
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
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query;
  const result: Array<Timestamp> = await mysql.query(
    'SELECT timestamp FROM cameras WHERE id = ?',
    [pid]
  );
  if (result.length > 0) {
    const timestamp = result[0].timestamp;
    res.status(200).end(timestamp.toString());
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
      await mysql.query('UPDATE cameras SET timestamp = ? WHERE id = ?', [
        body,
        pid,
      ]);
      res.status(200).end('success');
    } else {
      res.status(400).end('Data provided invalid');
    }
  }
}
