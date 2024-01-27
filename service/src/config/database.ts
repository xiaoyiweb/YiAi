import { join } from 'path';
import { ConnectionOptions, Connection } from 'typeorm';

const config: ConnectionOptions = {
  type: 'mysql',
  port: parseInt(process.env.DB_PORT),
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  logging: false,
  synchronize: true,
  charset: 'utf8mb4',
  // timezone: 'Z',
  timezone: '+08:00',
};
export default config;
