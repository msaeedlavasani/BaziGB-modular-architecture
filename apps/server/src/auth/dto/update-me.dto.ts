import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMeDto {
  @IsString()
  @IsNotEmpty()
  username!: string;
}
