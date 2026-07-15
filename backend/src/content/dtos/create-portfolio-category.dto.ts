import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePortfolioCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
