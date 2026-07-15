import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateSocialLinkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  platform!: string;

  @IsUrl({ protocols: ['https', 'http'], require_protocol: true })
  @IsNotEmpty()
  @MaxLength(2048)
  url!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  iconName!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
