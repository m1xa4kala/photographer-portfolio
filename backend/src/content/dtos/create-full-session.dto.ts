import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateFullSessionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
