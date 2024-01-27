import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from 'nestjs-config';
import { Connection } from 'typeorm';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule implements OnModuleInit {
  constructor(private readonly connection: Connection, private readonly config: ConfigService) {}
  private readonly logger = new Logger(DatabaseModule.name);
  onModuleInit(): void {
    const { database } = this.connection.options;
    this.logger.log(`Your MySQL database named ${database} has been connected`);
  }
}
