import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreatePriceItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[\d\s]+$/)
  price!: string; // можно хранить как строку с пробелами, например "8 000"

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
