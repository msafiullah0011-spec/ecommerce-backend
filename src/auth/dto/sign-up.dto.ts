import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: 'Jane Doe', description: 'Full name of the new user' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jane@example.com', description: 'Email address, must be unique' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Account password, minimum 8 characters',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
