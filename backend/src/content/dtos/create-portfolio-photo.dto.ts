import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreatePortfolioPhotoDto {
  @IsString()
  title!: string;

  @IsString()
  imageUrl!: string;

  @IsInt()
  sessionId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
