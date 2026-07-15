import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateFullSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
