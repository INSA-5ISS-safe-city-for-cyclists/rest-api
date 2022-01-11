import React, { Component } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from '../styles/Home.module.css';
import { Criteria } from '../types/criteria';

const micro = 1e-12;

const offsetDistance = 100;
const offsetSpeed = 20;

type GraphPoint = {
  name: string;
  Dangerous: number;
  FalsePositive: number;
  speed: number;
};

function generateUrl() {
  return window.location.origin + '/api/criteria';
}

export default class CriteriaChart extends Component {
  state = {
    chartData: [],
    opacity: {
      Dangerous: 0.5,
      FalsePositive: 0.5,
    },
  };

  handleMouseEnter = (o) => {
    const { dataKey } = o;
    const { opacity } = this.state;

    this.setState({
      opacity: { ...opacity, [dataKey]: 1 },
    });
  };

  handleMouseLeave = (o) => {
    const { dataKey } = o;
    const { opacity } = this.state;
    this.setState({
      opacity: { ...opacity, [dataKey]: 0.5 },
    });
  };

  data = [
    {
      name: '0',
      Dangerous: 0,
      FalsePositive: 200,
      speed: 0,
    },
    {
      name: '1-',
      Dangerous: 0,
      FalsePositive: 200,
      speed: 5 - micro,
    },
    {
      name: '1',
      Dangerous: 100,
      FalsePositive: 50,
      speed: 5,
    },
    {
      name: '2-',
      Dangerous: 100,
      FalsePositive: 50,
      speed: 30 - micro,
    },
    {
      name: '2',
      Dangerous: 150,
      FalsePositive: 50,
      speed: 30,
    },
    {
      name: '3',
      Dangerous: 150,
      FalsePositive: 50,
      speed: 50,
    },
  ];

  componentDidMount() {
    const fetchData = async () => {
      const data: Array<GraphPoint> = [];
      // Fetch all the data
      const promise = new Promise(async (res) => {
        const criteria: Criteria = await fetch(generateUrl()).then(
          async (response) => {
            return await response.json();
          }
        );

        // Point 1
        const point1: GraphPoint = {
          Dangerous: 0,
          FalsePositive: criteria.max_distance + offsetDistance,
          name: '1',
          speed: 0,
        };

        // Point 2-
        const point2Min: GraphPoint = {
          Dangerous: 0,
          FalsePositive: criteria.max_distance + offsetDistance,
          name: '2-',
          speed: criteria.min_speed_threshold - micro,
        };

        // Point 2
        const point2: GraphPoint = {
          Dangerous: criteria.max_distance,
          FalsePositive: criteria.min_distance_threshold,
          name: '2',
          speed: criteria.min_speed_threshold,
        };

        // Point 3-
        const point3Min: GraphPoint = {
          Dangerous: criteria.max_distance,
          FalsePositive: criteria.min_distance_threshold,
          name: '3-',
          speed: criteria.min_speed - micro,
        };

        // Point 3
        const point3: GraphPoint = {
          Dangerous:
            criteria.max_distance +
            offsetDistance -
            criteria.min_distance_threshold,
          FalsePositive: criteria.min_distance_threshold,
          name: '3',
          speed: criteria.min_speed,
        };

        // Point 4
        const point4: GraphPoint = {
          Dangerous:
            criteria.max_distance +
            offsetDistance -
            criteria.min_distance_threshold,
          FalsePositive: criteria.min_distance_threshold,
          name: '4',
          speed: criteria.min_speed + offsetSpeed,
        };

        data.push(point1, point2Min, point2, point3Min, point3, point4);
        // res(this.data);
        res(data);
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

  renderLegend = (props) => {
    const { payload } = props;

    return (
      <ul>
        {payload.map((entry, index) => (
          <li key={`item-${index}`}>{entry.value}</li>
        ))}
      </ul>
    );
  };

  render() {
    const { chartData, opacity } = this.state;
    return (
      <>
        <h1 className={styles.chartTitle}>
          Danger criteria chart depending on distance(cm) and relative speed
          (km/h)
        </h1>
        <ResponsiveContainer width={'100%'} aspect={1} maxHeight={600}>
          <AreaChart
            width={1}
            height={1}
            data={chartData}
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
                dx: -15,
              }}
              scale="linear"
            />
            <YAxis
              scale="linear"
              // dataKey="distance"
              label={{
                value: 'Distance(cm)',
                position: 'insideTopLeft',
                dy: 0,
                angle: 90,
              }}
            />
            {/*<Tooltip labelFormatter={() => ''} />*/}
            <Legend
              onMouseEnter={this.handleMouseEnter}
              onMouseLeave={this.handleMouseLeave}
            />
            <Area
              type="linear"
              dataKey="FalsePositive"
              stackId="1"
              stroke="#82ca9d"
              fill="#82ca9d"
              opacity={opacity.FalsePositive}
            />
            <Area
              type="linear"
              dataKey="Dangerous"
              stackId="1"
              stroke="#c42e17"
              fill="#c42e17"
              fillOpacity={opacity.Dangerous}
            />
          </AreaChart>
        </ResponsiveContainer>
      </>
    );
  }
}
