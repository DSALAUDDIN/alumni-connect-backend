import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiPropertyOptional({ description: 'Refresh token (for future refresh flow)' })
    @IsOptional()
    @IsString()
    refreshToken?: string;
}
