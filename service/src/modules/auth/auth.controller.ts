import { VerifyCodeDto } from '../verification/dto/verifyCode.dto';
import { UserLoginDto } from './dto/authLogin.dto';
import { Controller, Post, UseGuards, Body, Get, Query, Render, Res, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRegisterDto } from './dto/authRegister.dto';
import { Request, Response } from 'express';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { UpdatePassByOtherDto } from './dto/updatePassByOther.dto';
import { SendPhoneCodeDto } from './dto/sendPhoneCode.dto';
import { UserRegisterByPhoneDto } from './dto/userRegisterByPhone.dto';
import { LoginByPhoneDto } from './dto/loginByPhone.dt';
import { AdminLoginDto } from './dto/adminLogin.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() body: UserRegisterDto, @Req() req: Request) {
    return await this.authService.register(body, req);
  }

  @Post('registerByPhone')
  @ApiOperation({ summary: '用户通过手机号注册' })
  async registerByPhone(@Body() body: UserRegisterByPhoneDto, @Req() req: Request) {
    return await this.authService.registerByPhone(body, req);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() body: UserLoginDto, @Req() req: Request) {
    return this.authService.login(body, req);
  }

  @Post('loginByPhone')
  @ApiOperation({ summary: '用户手机号登录' })
  async loginByPhone(@Body() body: LoginByPhoneDto, @Req() req: Request) {
    return this.authService.loginByPhone(body, req);
  }

  @Post('updatePassword')
  @ApiOperation({ summary: '用户更改密码' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updatePassword(@Req() req: Request, @Body() body: UpdatePasswordDto) {
    return this.authService.updatePassword(req, body);
  }

  @Post('updatePassByOther')
  @ApiOperation({ summary: '用户更改密码' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updatePassByOther(@Req() req: Request, @Body() body: UpdatePassByOtherDto) {
    return this.authService.updatePassByOther(req, body);
  }

  @Get('getInfo')
  @ApiOperation({ summary: '获取用户个人信息' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getInfo(@Req() req: Request) {
    return this.authService.getInfo(req);
  }

  @Get('activateAccount')
  @ApiOperation({ summary: '账户激活' })
  async activateAccount(@Query() parmas: VerifyCodeDto, @Res() res: Response) {
    return this.authService.activateAccount(parmas, res);
  }

  @Get('registerSuccess')
  @ApiOperation({ summary: '注册成功页面' })
  @Render('registerSuccess')
  async registerSuccess(@Query() parmas) {
    const { username, id, email, teamName, registerSuccessEmailTitle, registerSuccessEmailTeamName, registerSuccessEmaileAppend } = parmas;
    return { username, id, email, teamName, registerSuccessEmailTitle, registerSuccessEmailTeamName, registerSuccessEmaileAppend };
  }

  @Get('registerError')
  @ApiOperation({ summary: '注册失败页面' })
  @Render('registerError')
  async registerError(@Query() parmas) {
    const { message, teamName, registerFailEmailTitle, registerFailEmailTeamName } = parmas;
    return { message, teamName, registerFailEmailTitle, registerFailEmailTeamName };
  }

  @Post('captcha')
  @ApiOperation({ summary: '获取一个图形验证码' })
  async captcha(@Body() parmas) {
    return this.authService.captcha(parmas);
  }

  @Post('sendPhoneCode')
  @ApiOperation({ summary: '发送手机验证码' })
  async sendPhoneCode(@Body() parmas: SendPhoneCodeDto) {
    return this.authService.sendPhoneCode(parmas);
  }
}
