import { NextApiRequest, NextApiResponse } from 'next';
import criteria from '../../constants/criteria';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      res.status(200).json(criteria);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
