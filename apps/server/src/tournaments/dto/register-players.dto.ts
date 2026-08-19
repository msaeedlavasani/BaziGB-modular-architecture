import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class RegisterPlayersDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(64)
  playerIds!: string[];
}
