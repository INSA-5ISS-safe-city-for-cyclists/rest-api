This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## MYSQL Initialization

- Create the database :
```sql
CREATE database safe_city_for_cyclists;
```

- Create a user and give permissions :
```sql
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin123';
GRANT ALL PRIVILEGES ON safe_city_for_cyclists.* TO 'admin'@'localhost';
```

- Create the table for reports:
```sql
CREATE table safe_city_for_cyclists.reports(
id int NOT NULL AUTO_INCREMENT,
timestamp int NOT NULL,
distance double NOT NULL,
object_speed double NOT NULL,
bicycle_speed double NOT NULL,
latitude double NOT NULL,
longitude double NOT NULL,
dangerous bool NOT NULL,
PRIMARY KEY (id)
);
```
- Create the table for criteria:
```sql
CREATE table safe_city_for_cyclists.criteria(
name VARCHAR(12) NOT NULL,
value float NOT NULL,
PRIMARY KEY (name)
);
```

- Create entry for criteria:
```sql
INSERT INTO safe_city_for_cyclists.criteria VALUES ('min_speed', 30.0);
INSERT INTO safe_city_for_cyclists.criteria VALUES ('max_distance', 100.0);
```

NB: configure the correct port in [constants/db.ts](constants/db.ts)

## Recentness configuration
Configure the recentness of the zones in [constants/monthsOld.ts](constants/monthsOld.ts)

## Time filter configuration
Configure the hour range of the zones in [constants/reportTimeHourRange.ts](constants/reportTimeHourRange.ts)  
- for instance, when set it to 1, we take in account only the report that were done +/- 1h from current hour of day

## Criteria configuration
Configure the default criteria value in [constants/criteria.ts](types/criteria.ts)

## API
- [http://localhost:3000/api/reports](http://localhost:3000/api/reports)
  - POST : add the given reports to the database (given in GeoJson format)
  - DELETE : delete the given reports from the database (by ids)

- [http://localhost:3000/api/zones](http://localhost:3000/api/zones):
  - GET : retrieve the zones according to the following rules :
    - For all requests, we take in account the recentness parameter  
    - By default, all the zones using the time filter
    - Query parameters :
      - dangerous = 0, 1, true, or false (default: none)
      - time_filter = 0, or false (the time filter is activated by default)
      - hours from 0 to 24 (specifies time of day when the time filter is on)
      - minutes from 0 to 60 (specifies time of day when the time filter is on)

- [http://localhost:3000/api/criteria](http://localhost:3000/api/criteria):
  - GET : retrieve the criteria
  - POST : update the criteria (if the given authorization key is correct)

## JSON and GeoJSON format for POST requests

GeoJSON format used for reports:
```json5
{
    features: [
      {
        geometry: { coordinates: [1.453, 43.602, 0.0], type: 'Point' },
        properties: {
          id: 1,
          bicycle_speed: 4.0,
          object_speed: 3.0,
          distance: 2.0,
          sync: false,
          timestamp: 1638733392089,
        },
        type: 'Feature',
      },
      {
        geometry: {
          coordinates: [1.463, 43.611999999999995, 0.0],
          type: 'Point',
        },
        properties: {
          id: 2,
          bicycle_speed: 5.0,
          object_speed: 4.0,
          distance: 3.0,
          sync: false,
          timestamp: 1638796649644,
        },
        type: 'Feature',
      },
      {
        geometry: { coordinates: [1.473, 43.622, 0.0], type: 'Point' },
        properties: {
          id: 3,
          bicycle_speed: 6.0,
          object_speed: 5.0,
          distance: 4.0,
          sync: false,
          timestamp: 1638796666485,
        },
        type: 'Feature',
      },
    ],
    type: 'FeatureCollection',
  }
```

JSON format used for criteria
```json5
{
  // Criteria to set a report as dangerous
  minSpeed: 30.0, // When relativeSpeed=(objectSpeed-bicycleSpeed) is greater than this criteria (in km/h)
  maxDistance: 100.0, // When distance is smaller than this criteria (in cm)
}
```


