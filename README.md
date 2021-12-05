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

- Create the table :
```sql
CREATE table safe_city_for_cyclists.reports(
id int NOT NULL AUTO_INCREMENT,
timestamp int NOT NULL,
distance float NOT NULL,
object_speed float NOT NULL,
bicycle_speed float NOT NULL,
latitude float NOT NULL,
longitude float NOT NULL,
dangerous bool NOT NULL,
PRIMARY KEY (id)
);
```

NB: configure the correct port in [constants/db.ts](constants/db.ts)

## Criteria configuration
Configure the criteria in [constants/criteria.ts](constants/criteria.ts)

## API
- [http://localhost:3000/api/reports](http://localhost:3000/api/reports)
  - GET : retrieve all the reports (can add path parameter "dangerous" )
  - DELETE : delete the given reports (an array of ids)

- [http://localhost:3000/api/reports/update-all](http://localhost:3000/api/update-all)
  - GET : update all the database according to the current criteria


- [http://localhost:3000/api/criteria](http://localhost:3000/api/criteria):
  - GET : retrieve the criteria

```json5
{
  // Criteria to set a report as dangerous
  minSpeed: 30.0, // When relativeSpeed=(objectSpeed-bicycleSpeed) is greater than this criteria (in km/h)
  maxDistance: 100.0, // When distance is smaller than this criteria (in cm)
}
```


