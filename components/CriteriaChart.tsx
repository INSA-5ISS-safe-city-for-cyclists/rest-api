import React, { Component } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from '../styles/Home.module.css';

const data = [
  {
    name: '(0, 20)',
    dangerous: 5,
    falsePositive: 20,
    distance: 0,
    speed: 20,
  },
  {
    name: '(20, 0)',
    dangerous: 10,
    falsePositive: 0,
    distance: 20,
    speed: 0,
  },
  {
    name: '(20, 20)',
    dangerous: 20,
    falsePositive: 0,
    distance: 20,
    speed: 20,
  },
];

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

export default class CriteriaChart extends Component {
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
    // const { chartData } = this.state;
    // const { chartData } = data;
    const chartData = data;
    // let aspect = 4.0;
    // if (isMobile) aspect = 1.0;
    return (
      <>
        <h1 className={styles.chartTitle}>
          Danger criteria chart depending on distance(cm) and relative speed
          (km/h)
        </h1>
        <ResponsiveContainer width={'100%'} aspect={1} maxHeight={600}>
          <LineChart
            width={1}
            height={1}
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="speed"
              label={{
                value: 'Speed(km/h)',
                position: 'insideBottomRight',
                dy: 15,
              }}
            />
            <YAxis
              dataKey="distance"
              label={{
                value: 'Distance(cm)',
                position: 'insideTopLeft',
                dy: 15,
              }}
            />
            <Tooltip labelFormatter={() => ''} />
            <Legend />
            <Line type="monotone" dataKey="dangerous" stroke="#8884d8" />
            <Line type="monotone" dataKey="falsePositive" stroke="#82ca9d" />
            <Line type="monotone" dataKey="speed" stroke="#000000" />
            <Line type="monotone" dataKey="distance" stroke="#000000" />
          </LineChart>
        </ResponsiveContainer>
      </>
    );
  }
}
