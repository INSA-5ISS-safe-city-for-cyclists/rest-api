import { NextApiRequest, NextApiResponse } from 'next';
import criteria from '../../constants/criteria';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      await handleGET(req, res);
      break;
    case 'POST':
      await handlePOST(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

async function handleGET(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(criteria);
}

// TODO retrieve new config
async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).end('success');
}
