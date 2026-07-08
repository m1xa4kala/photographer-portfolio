import { IsString, IsOptional } from 'class-validator';

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
}
