import { join } from 'path';

const config = {
  port: parseInt(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USER,
};

export default config;
