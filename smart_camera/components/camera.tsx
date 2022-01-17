import { Button, Card, CardContent, Typography } from '@mui/material';
import React from 'react';
import Url from '../constants/Url';

export type CameraType = {
  id: string;
  timestamp: string;
  counter: number;
  temperature: number;
};

type Props = {
  camera: CameraType;
};

export default function Camera(props: Props) {
  const { camera } = props;
  return (
    <Card>
      <CardContent>
        <Typography variant="h3" component="div" gutterBottom>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            Camera #{camera.id}
          </div>
        </Typography>
        <Typography variant="h5">
          <div>Count = {camera.counter}</div>
          <div>Last temperature = {camera.temperature} Celsius</div>
          <div>Timestamp = {camera.timestamp}</div>
        </Typography>
        <Typography>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '25px',
            }}
          >
            <Button
              size={'small'}
              disabled={camera.counter == 0}
              onClick={() => {
                fetch(Url.server_url + '/cameras/' + camera.id + '/counter', {
                  method: 'DELETE',
                })
                  .then((res) => {
                    if (res.ok) {
                      alert('Reset counter');
                    } else {
                      alert('Could not reset counter:\nStatus ' + res.status);
                    }
                  })
                  .catch(() => {
                    alert('Could not reset counter:\nCould not reach host');
                  });
              }}
            >
              Reset counter
            </Button>
          </div>
        </Typography>
      </CardContent>
    </Card>
  );
}
