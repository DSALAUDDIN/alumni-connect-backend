import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new collaborative project' })
    create(@Body() dto: CreateProjectDto, @CurrentUser('id') userId: string) {
        return this.projectsService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Browse all projects' })
    findAll() {
        return this.projectsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project details' })
    findOne(@Param('id') id: string) {
        return this.projectsService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a project' })
    remove(@Param('id') id: string) {
        return this.projectsService.remove(id);
    }
}
