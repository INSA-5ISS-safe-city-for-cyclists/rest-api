import Head from 'next/head';
import styles from '../styles/Home.module.css';
import React from 'react';
import DangerGraph from '../components/DangerGraph';
import CriteriaChart from '../components/CriteriaChart';
import { FaGithub } from 'react-icons/fa';
// import dynamic from 'next/dynamic';

// const MyDangerGraph = dynamic(() => import('../components/DangerGraph'), {
//   ssr: true,
// });

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Safe City for Cyclists</title>
        <meta name="description" content="Safe City for Cyclists" />
        <link rel="icon" href={'/favicon.ico'} />
      </Head>

      <nav className={'navbar'}>
        <ul>
          <li />
          <li key="nav-link-href-label">
            <FaGithub
              size={50}
              onClick={() =>
                open(
                  'https://github.com/INSA-5ISS-safe-city-for-cyclists/rest-api'
                )
              }
              style={{ cursor: 'pointer' }}
            />
          </li>
        </ul>

        <style jsx>{`
          :global(body) {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, Avenir Next, Avenir,
              Helvetica, sans-serif;
          }
          nav {
            text-align: center;
          }
          ul {
            display: flex;
            justify-content: space-between;
          }
          nav > ul {
            padding: 4px 16px;
          }
          li {
            display: flex;
            padding: 6px 8px;
          }
          a {
            color: #067df7;
            text-decoration: none;
            font-size: 13px;
          }
        `}</style>
      </nav>

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
        <CriteriaChart />
      </main>
    </div>
  );
}
