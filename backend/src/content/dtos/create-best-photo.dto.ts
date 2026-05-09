import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateBestPhotoDto {
  @IsString()
  title!: string;

  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
