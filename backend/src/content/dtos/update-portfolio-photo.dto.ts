import { PartialType } from '@nestjs/mapped-types';
import { CreatePortfolioPhotoDto } from './create-portfolio-photo.dto';

export class UpdatePortfolioPhotoDto extends PartialType(
  CreatePortfolioPhotoDto,
) {}
