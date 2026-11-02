import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateWeddingFaqItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  answer!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}