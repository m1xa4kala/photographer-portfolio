import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

export type UserWithoutPassword = { id: number; email: string };

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const count = await this.userRepository.count();
    if (count === 0) {
      const admin = this.userRepository.create({
        email: 'admin@example.com',
        passwordHash: 'admin123', // will be hashed by @BeforeInsert
      });
      await this.userRepository.save(admin);
      console.log('✅ Администратор создан: admin@example.com / admin123');
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
