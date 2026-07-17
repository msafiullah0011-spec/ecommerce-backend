import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j', description: 'Id of the product to add' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity to add (or add to the existing quantity)', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
