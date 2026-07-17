import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 16 Pro', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Latest flagship phone', description: 'Optional product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 999.99, description: 'Unit price', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50, description: 'Units currently in stock', minimum: 0 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'https://example.com/iphone.jpg', description: 'Product image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j', description: 'Id of the category this product belongs to' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
