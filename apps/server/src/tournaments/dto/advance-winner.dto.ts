import { IsString } from 'class-validator';

export class AdvanceWinnerDto {
  @IsString()
  winnerId!: string;
}
