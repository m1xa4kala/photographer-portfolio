import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreatePriceItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  price!: string; // можно хранить как строку с пробелами, например "8 000"

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
