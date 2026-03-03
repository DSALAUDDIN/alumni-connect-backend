import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { CreateEmergencyAlertDto } from './dto/create-alert.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Emergency')
@ApiBearerAuth('access-token')
@Controller('emergency')
export class EmergencyController {
    constructor(private readonly emergencyService: EmergencyService) { }

    @Post()
    @ApiOperation({ summary: 'Report an emergency alert — triggers FCM push to all users' })
    create(@Body() dto: CreateEmergencyAlertDto, @CurrentUser('id') userId: string) {
        return this.emergencyService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all active emergency alerts' })
    findAll() {
        return this.emergencyService.findAll();
    }

    @Patch(':id/resolve')
    @ApiOperation({ summary: 'Mark an emergency alert as resolved' })
    resolve(@Param('id') id: string) {
        return this.emergencyService.resolve(id);
    }
}
