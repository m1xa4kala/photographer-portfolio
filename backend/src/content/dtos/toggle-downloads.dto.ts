import { IsBoolean } from 'class-validator';

export class ToggleDownloadsDto {
  @IsBoolean()
  enabled!: boolean;
}
