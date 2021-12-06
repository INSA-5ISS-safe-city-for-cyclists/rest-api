import type { NextApiRequest, NextApiResponse } from 'next';
import criteria from '../../../constants/criteria';
import { isDeleteDataValid, mysql } from '../reports';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const gjv = require('geojson-validation');

function isGetResponseDataValid(geoJson: object) {
  return gjv.valid(geoJson);
}

function isPostDataValid(data: string) {
  return gjv.valid(JSON.parse(data));
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
  const { method, body } = req;
  switch (method) {
    case 'GET':
      let result = '';
      if (
        req.query.dangerous &&
        ['true', 'false', '1', '0'].includes(<string>req.query.dangerous)
      ) {
        const dangerous = ['true', '1'].includes(<string>req.query.dangerous);
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
        res.status(400).json('Error while creating geoJson');
      }
      break;
    case 'DELETE':
      if (isDeleteDataValid(body)) {
        body.forEach((id) => {
          mysql.query('DELETE FROM reports WHERE id = ?', [id]);
        });
        res.status(200).end('success');
      } else {
        res.status(400).end('Data provided invalid');
      }
      break;
    case 'POST':
      if (!body) {
        res.status(400).end('No data provided');
      } else {
        if (isPostDataValid(body)) {
          const features = JSON.parse(body).features;
          features.forEach((feature) => {
            const properties = feature.properties;
            const latitude = feature.geometry.coordinates[1];
            const longitude = feature.geometry.coordinates[0];
            mysql.query(
              'INSERT INTO reports (timestamp, distance, object_speed, bicycle_speed, latitude, longitude, dangerous) VALUES(?, ?, ?, ?, ?, ?, ?)',
              [
                // TODO check timestamp format (seconds)
                properties.timestamp / 1000,
                properties.distance,
                properties.object_speed,
                properties.bicycle_speed,
                latitude,
                longitude,
                properties.object_speed - properties.bicycle_speed >=
                  criteria.minSpeed ||
                  properties.distance <= criteria.maxDistance,
              ]
            );
          });
          res.status(200).end('success');
        } else {
          res.status(400).end('Data provided invalid');
        }
      }
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
