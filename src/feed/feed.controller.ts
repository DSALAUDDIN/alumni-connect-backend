import { Controller, Get, Post, Delete, Param, Body, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { multiImageMulterOptions } from '../core/cloudinary/multer.config';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class CreateCommentDto {
    @ApiProperty({ example: 'Great post! Totally agree.' })
    @IsString()
    content: string;
}

@ApiTags('Feed')
@ApiBearerAuth('access-token')
@Controller('feed')
export class FeedController {
    constructor(private readonly feedService: FeedService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new feed post (supports media upload)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'string' },
                groupId: { type: 'string' },
                files: { type: 'array', items: { type: 'string', format: 'binary' } },
            },
            required: ['content'],
        },
    })
    @UseInterceptors(FilesInterceptor('files', 5, multiImageMulterOptions))
    create(
        @Body() dto: CreatePostDto,
        @CurrentUser('id') userId: string,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        return this.feedService.create(userId, dto, files);
    }

    @Get()
    @ApiOperation({ summary: 'Get the global or group news feed' })
    @ApiQuery({ name: 'groupId', required: false })
    findAll(@Query('groupId') groupId?: string) {
        return this.feedService.findAll(groupId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single post with comments' })
    findOne(@Param('id') id: string) {
        return this.feedService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a post' })
    remove(@Param('id') id: string) {
        return this.feedService.remove(id);
    }

    @Post(':id/like')
    @ApiOperation({ summary: 'Toggle like on a post' })
    toggleLike(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.feedService.toggleLike(id, userId);
    }

    @Post(':id/comment')
    @ApiOperation({ summary: 'Add a comment to a post' })
    comment(
        @Param('id') id: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.feedService.addComment(id, userId, dto.content);
    }
}
