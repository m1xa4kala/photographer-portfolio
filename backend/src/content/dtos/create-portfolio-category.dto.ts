import { IsString } from 'class-validator';

export class CreatePortfolioCategoryDto {
  @IsString()
  name!: string;
}
