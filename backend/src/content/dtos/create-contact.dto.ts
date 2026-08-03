import {
  IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Min, MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @IsEnum(['phone', 'social'])
  type!: 'phone' | 'social';

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  iconName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}