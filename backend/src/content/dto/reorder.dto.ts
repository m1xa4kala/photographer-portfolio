import { IsArray, IsInt, Min, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @IsInt()
  id!: number;

  @IsInt()
  @Min(0)
  orderIndex!: number;
}

export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}