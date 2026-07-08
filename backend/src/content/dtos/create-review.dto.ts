import { IsString, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  clientName!: string;

  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  clientPhotoUrl?: string;
}
