import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { AppConfig } from '../config/config.interface';

export type UserWithoutPassword = { id: number; email: string };

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService<AppConfig>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const count = await this.userRepository.count();
    if (count === 0) {
      const adminEmail = this.configService.get(
        'adminEmail',
        'admin@example.com',
      );
      const adminPassword = this.configService.get('adminPassword', 'admin123');
      const admin = this.userRepository.create({
        email: adminEmail,
        passwordHash: adminPassword, // will be hashed by @BeforeInsert
      });
      await this.userRepository.save(admin);
      console.log(`✅ Администратор создан: ${adminEmail} / ${adminPassword}`);
    }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return { id: user.id, email: user.email };
    }
    return null;
  }

  login(user: UserWithoutPassword) {
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async getMe(userId: number): Promise<UserWithoutPassword | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;
    return { id: user.id, email: user.email };
  }
}
