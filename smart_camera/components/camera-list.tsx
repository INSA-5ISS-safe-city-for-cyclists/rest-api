import Camera, { CameraType } from './camera';
import { Container, Grid, Typography } from '@mui/material';
import React from 'react';

export type CameraListType = Array<CameraType>;

type Props = {
  cameras?: CameraListType;
};

export default function CameraList(props: Props) {
  const { cameras } = props;

  if (cameras != null) {
    return (
      <Grid
        container={true}
        justifyContent="center"
        spacing={{ xs: 2, md: 5 }}
        columns={{ xs: 2, sm: 8, md: 12 }}
      >
        {cameras?.map((c, index) => (
          <Grid item={true} xs={3} sm={5} md={5} key={index}>
            <Camera camera={c} />
          </Grid>
        ))}
      </Grid>
    );
  } else {
    return (
      <Container>
        <Typography
          variant="h4"
          component="h4"
          gutterBottom={true}
          align={'center'}
          color={'secondary'}
        >
          Cameras unavailable
        </Typography>
      </Container>
    );
  }
}
