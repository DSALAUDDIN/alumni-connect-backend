import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Jobs')
@ApiBearerAuth('access-token')
@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) { }

    @Post()
    @ApiOperation({ summary: 'Post a new job listing' })
    create(@Body() dto: CreateJobDto, @CurrentUser('id') userId: string) {
        return this.jobsService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Browse open job listings' })
    findAll() {
        return this.jobsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get job listing details' })
    findOne(@Param('id') id: string) {
        return this.jobsService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove a job listing' })
    remove(@Param('id') id: string) {
        return this.jobsService.remove(id);
    }
}
