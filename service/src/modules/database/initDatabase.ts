import { Connection, ConnectionOptions } from 'typeorm';
import * as mysql from 'mysql2/promise';
import { ConfigService } from 'nestjs-config';
import { HttpException, Logger } from '@nestjs/common';
import * as os from 'os';
import * as fetch from 'isomorphic-fetch';

export function initDatabase() {
  mysql
    .createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: parseInt(process.env.DB_PORT),
    })
    .then(async (conn) => {
      const [rows] = await conn.execute(`SHOW DATABASES LIKE '${process.env.DB_DATABASE}'`);
      if (Array.isArray(rows) && rows.length === 0) {
        await conn.execute(`CREATE DATABASE ${process.env.DB_DATABASE}`);
        Logger.log(`数据库创建成功[${process.env.DB_DATABASE}]`);
      }
      await conn.end();
    });
}
