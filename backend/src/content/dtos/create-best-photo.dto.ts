import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateBestPhotoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsUrl({ protocols: ['https', 'http'], require_protocol: true })
  @IsNotEmpty()
  @MaxLength(2048)
  imageUrl!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
