import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreatePortfolioCategoryDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
