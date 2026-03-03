import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Groups')
@ApiBearerAuth('access-token')
@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new group/chapter' })
    create(@Body() dto: CreateGroupDto) {
        return this.groupsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all groups' })
    findAll() {
        return this.groupsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a group with members' })
    findOne(@Param('id') id: string) {
        return this.groupsService.findOne(id);
    }

    @Post(':id/join')
    @ApiOperation({ summary: 'Join a group' })
    join(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.groupsService.join(id, userId);
    }

    @Delete(':id/leave')
    @ApiOperation({ summary: 'Leave a group' })
    leave(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.groupsService.leave(id, userId);
    }
}
