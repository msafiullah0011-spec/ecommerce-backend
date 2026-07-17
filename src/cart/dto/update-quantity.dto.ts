import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateQuantityDto {
  @ApiProperty({ example: 5, description: 'Exact quantity to set (replaces, does not add to, the current value)', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
