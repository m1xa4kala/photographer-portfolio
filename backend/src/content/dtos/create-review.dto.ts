import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  clientName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  clientPhotoUrl?: string;
}
