import React, { Component } from 'react';
import { isMobile } from 'react-device-detect';
import {
  XAxis,
  CartesianGrid,
  YAxis,
  BarChart,
  Tooltip,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import styles from '../styles/Home.module.css';

type NumberOfReports = {
  name: string;
  number_of_reports: number;
};

function generateUrl(minHour: number, maxHour: number): string {
  return (
    window.location.origin +
    '/api/count_reports?dangerous=true&min_hour=' +
    minHour +
    '&max_hour=' +
    maxHour
  );
}

export default class DangerGraph extends Component {
  state = {
    chartData: [],
  };

  componentDidMount() {
    const fetchData = async () => {
      const data: Array<NumberOfReports> = [];
      // Fetch all the data
      const promise = new Promise(async (res) => {
        for (const hour of Array.from(Array(24).keys())) {
          // For each hour, we fetch get the number of reports
          const numberOfReports = +(await fetch(
            generateUrl(hour, hour + 1)
          ).then(async (response) => {
            return await response.text();
          }));
          const name =
            hour.toLocaleString('fr', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            }) + ':00';
          data.push({
            name: name,
            number_of_reports: numberOfReports,
          });
        }
        res(data);
        // setTimeout(() => {
        //   res(data);
        // }, 1500);
      });
      const res = await promise;

      //After getting the data from the backend,
      //format it as per how the LineChart is expecting
      this.setState({
        chartData: res,
      });
    };
    fetchData().then();
  }

  render() {
    const { chartData } = this.state;
    let aspect = 4.0;
    if (isMobile) aspect = 1.0;
    return (
      <>
        <h1 className={styles.chartTitle}>
          Number of reports depending on hour of day
        </h1>
        <ResponsiveContainer width="100%" aspect={aspect}>
          <BarChart data={chartData}>
            <defs>
              <linearGradient
                id="gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="100%"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="red" />
                <stop offset=".5" stopColor="yellow" />
                <stop offset="1" stopColor="green" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" minTickGap={10} />
            <YAxis />
            <Tooltip />
            {/*<Legend />*/}
            <Bar dataKey="number_of_reports" fill="url(#gradient)" />
          </BarChart>
        </ResponsiveContainer>
      </>
    );
  }
}
