import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateAboutDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bioText?: string;
}
