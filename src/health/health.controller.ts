import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    @ApiOperation({ summary: 'System health check — no auth required' })
    check() {
        return this.healthService.checkAll();
    }
}
