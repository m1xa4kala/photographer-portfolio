import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateAboutDto {
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  bioText?: string;

  @IsOptional()
  @IsString()
  equipmentText?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  socialLinks?: { instagram?: string; telegram?: string; vk?: string };
}
