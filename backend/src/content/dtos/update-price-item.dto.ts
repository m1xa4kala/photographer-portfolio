import { PartialType } from '@nestjs/mapped-types';
import { CreatePriceItemDto } from './create-price-item.dto';

export class UpdatePriceItemDto extends PartialType(CreatePriceItemDto) {}
