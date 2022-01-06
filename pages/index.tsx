import Head from 'next/head';
import styles from '../styles/Home.module.css';
import React from 'react';
import DangerGraph from '../components/DangerGraph';

// // components/MyChart.js contains the recharts chart
// const MyDangerGraph = dynamic(() => import('../components/DangerGraph'), {
//   ssr: false,
// });

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Safe City for Cyclists</title>
        <meta name="description" content="Safe City for Cyclists" />
        <link rel="icon" href={'/favicon.ico'} />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to{' '}
          <a
            target={'_blank'}
            href="https://github.com/INSA-5ISS-safe-city-for-cyclists"
            rel="noreferrer"
          >
            Safe City for Cyclists
          </a>
        </h1>

        <p className={styles.description}>
          Get all the information about the reports done by Safe City for
          Cyclists
        </p>
        <DangerGraph />
      </main>
    </div>
  );
}
