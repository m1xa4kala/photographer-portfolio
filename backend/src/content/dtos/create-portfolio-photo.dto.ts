import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreatePortfolioPhotoDto {
  @IsString()
  title!: string;

  @IsString()
  imageUrl!: string;

  @IsInt()
  categoryId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
