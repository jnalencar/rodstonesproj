import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { Permissions } from './decorators/permissions.decorator';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { CurrentUser } from './decorators/current-user.decorator';
import { SwitchCompanyDto } from './dto/switch-company.dto';
import { CompanyContextGuard } from './guards/company-context.guard';
import { CompanyContextData } from './interfaces/company-context-interface';
import { CompanyContext } from './decorators/company-context.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserById(user.userId);
  }

  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles('PLATFORM_ADMIN')
  //@Get('admin-test')
  //adminTest() {
  //  return {
  //    message: 'Você é administrador da plataforma',
  //  };
  //}

  //@Get('test-compread-permission')
  //@UseGuards(JwtAuthGuard, PermissionsGuard)
  //@Permissions('company:read')
  //testSellerPermission() {
  //  return {
  //    message: 'Você possui company:read',
  //  };
  //}

  //@Get('context')
  //@UseGuards(JwtAuthGuard)
  //getContext(@CurrentUser() user: AuthenticatedUser) {
  //  return user;
  //}

  @Post('switch-company')
  @UseGuards(JwtAuthGuard)
  switchCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchCompanyDto,
  ) {
    return this.authService.switchCompany(
      user.userId,
      dto,
    );
  }

  @Get('company-context-test')
  @UseGuards(JwtAuthGuard, CompanyContextGuard)
  testCompanyContext(
    @CompanyContext() context: CompanyContextData,
  ) {
    return context;
  }
}