import db from '../constants/db';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export default require('serverless-mysql')({
  config: db,
});
