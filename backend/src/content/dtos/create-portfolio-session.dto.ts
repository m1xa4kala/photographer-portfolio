import { IsString, IsNotEmpty, IsInt, MaxLength } from 'class-validator';

export class CreatePortfolioSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsInt()
  categoryId!: number;
}
