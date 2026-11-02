import { PartialType } from '@nestjs/mapped-types';
import { CreateWeddingPackageDto } from './create-wedding-package.dto';

export class UpdateWeddingPackageDto extends PartialType(
  CreateWeddingPackageDto,
) {}
