import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from '../../util/mysql';
import gjv from 'geojson-validation';

function isGetResponseDataValid(geoJson: object) {
  return gjv.valid(geoJson);
}

function generateGeoJson(result: string) {
  const features = [];
  JSON.parse(JSON.stringify(result)).forEach((v) => {
    features.push({
      geometry: {
        coordinates: [v.longitude, v.latitude, 0.0],
        type: 'Point',
      },
      properties: {
        id: v.id,
        bicycle_speed: v.bicycle_speed,
        object_speed: v.object_speed,
        distance: v.distance,
        dangerous: v.dangerous,
        timestamp: v.timestamp * 1000,
      },
      type: 'Feature',
    });
  });
  return {
    type: 'FeatureCollection',
    features: features,
  };
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      await handleGET(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

// TODO convert into zones
async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;
  let result = '';
  if (
    query.dangerous &&
    ['true', 'false', '1', '0'].includes(<string>query.dangerous)
  ) {
    const dangerous = ['true', '1'].includes(<string>query.dangerous);
    result = await mysql.query(
      'SELECT * FROM reports WHERE dangerous = ?',
      dangerous // true or false
    );
  } else {
    result = await mysql.query('SELECT * FROM reports');
  }
  const geoJson = generateGeoJson(result);
  if (isGetResponseDataValid(geoJson)) {
    res.status(200).json(geoJson);
  } else {
    res.status(400).end('Error while creating geoJson');
  }
}
