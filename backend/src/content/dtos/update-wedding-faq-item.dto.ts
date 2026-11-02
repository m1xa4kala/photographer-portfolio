import { PartialType } from '@nestjs/mapped-types';
import { CreateWeddingFaqItemDto } from './create-wedding-faq-item.dto';

export class UpdateWeddingFaqItemDto extends PartialType(CreateWeddingFaqItemDto) {}