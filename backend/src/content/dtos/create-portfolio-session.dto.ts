import { IsString, IsInt } from 'class-validator';

export class CreatePortfolioSessionDto {
  @IsString()
  name!: string;

  @IsInt()
  categoryId!: number;
}
