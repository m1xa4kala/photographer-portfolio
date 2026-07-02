import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { Throttle, SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './login.dto';

interface RequestWithUser {
  user: { userId: number; email: string };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      return { error: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: RequestWithUser) {
    return this.authService.getMe(req.user.userId);
  }
}
