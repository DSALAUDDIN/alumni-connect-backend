import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MentorshipService } from './mentorship.service';
import { CreateMentorshipDto } from './dto/create-mentorship.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Mentorship')
@ApiBearerAuth('access-token')
@Controller('mentorship')
export class MentorshipController {
    constructor(private readonly mentorshipService: MentorshipService) { }

    @Post()
    @ApiOperation({ summary: 'Request mentorship from an alumni mentor' })
    request(@Body() dto: CreateMentorshipDto, @CurrentUser('id') userId: string) {
        return this.mentorshipService.request(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all mentorship connections' })
    findAll() {
        return this.mentorshipService.findAll();
    }

    @Patch(':id/accept')
    @ApiOperation({ summary: 'Accept a mentorship request' })
    accept(@Param('id') id: string) {
        return this.mentorshipService.accept(id);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Mark a mentorship as completed' })
    complete(@Param('id') id: string) {
        return this.mentorshipService.complete(id);
    }
}
