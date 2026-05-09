import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  clientName!: string;

  @IsString()
  text!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
