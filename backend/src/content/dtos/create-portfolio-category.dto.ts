import { IsString, IsOptional } from 'class-validator';

export class CreatePortfolioCategoryDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
