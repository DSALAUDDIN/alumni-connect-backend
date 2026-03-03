import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Events')
@ApiBearerAuth('access-token')
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new event' })
    create(@Body() dto: CreateEventDto) {
        return this.eventsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get upcoming events' })
    findAll() {
        return this.eventsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get event details and RSVPs' })
    findOne(@Param('id') id: string) {
        return this.eventsService.findOne(id);
    }

    @Post(':id/rsvp')
    @ApiOperation({ summary: 'RSVP to an event (GOING by default)' })
    rsvp(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.eventsService.rsvp(id, userId);
    }
}
