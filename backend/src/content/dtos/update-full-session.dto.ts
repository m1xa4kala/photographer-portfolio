import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateFullSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
