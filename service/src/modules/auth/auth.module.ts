import { VerifycationEntity } from '../verification/verifycation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from '../verification/verification.service';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService, ConfigModule } from 'nestjs-config';
import { AuthController } from './auth.controller';
import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@/common/auth/jwt.strategy';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { BalanceEntity } from '../userBalance/balance.entity';
import { AccountLogEntity } from '../userBalance/accountLog.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { RedisCacheModule } from '../redisCache/redisCache.module';
import { UserBalanceEntity } from '../userBalance/userBalance.entity';
import { SalesUsersEntity } from '../sales/salesUsers.entity';
import { UserEntity } from '../user/user.entity';
import { WhiteListEntity } from '../chatgpt/whiteList.entity';
import { FingerprintLogEntity } from '../userBalance/fingerprint.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { MidjourneyEntity } from '../midjourney/midjourney.entity';

@Global()
@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => configService.get('jwt'),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      VerifycationEntity,
      BalanceEntity,
      AccountLogEntity,
      ConfigEntity,
      CramiPackageEntity,
      RedisCacheModule,
      UserBalanceEntity,
      SalesUsersEntity,
      UserEntity,
      WhiteListEntity,
      FingerprintLogEntity,
      ChatLogEntity,
      ChatGroupEntity,
      MidjourneyEntity
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, MailerService, VerificationService, UserBalanceService, RedisCacheService],
  exports: [AuthService],
})
export class AuthModule {}
