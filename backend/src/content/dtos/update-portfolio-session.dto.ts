import { PartialType } from '@nestjs/mapped-types';
import { CreatePortfolioSessionDto } from './create-portfolio-session.dto';

export class UpdatePortfolioSessionDto extends PartialType(
  CreatePortfolioSessionDto,
) {}
