import { PartialType } from '@nestjs/mapped-types';
import { CreateBestPhotoDto } from './create-best-photo.dto';

export class UpdateBestPhotoDto extends PartialType(CreateBestPhotoDto) {}
