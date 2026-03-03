import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertType } from '@prisma/client';

export class CreateEmergencyAlertDto {
    @ApiProperty({ enum: AlertType, example: AlertType.BLOOD_DONATION })
    @IsEnum(AlertType)
    type: AlertType;

    @ApiProperty({ example: 'Urgently need O+ blood near Dhaka Medical College.' })
    @IsString()
    @MaxLength(500)
    message: string;

    @ApiPropertyOptional({ example: 'Dhaka Medical College' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    location?: string;
}
