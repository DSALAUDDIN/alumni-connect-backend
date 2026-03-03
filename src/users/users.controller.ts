import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { singleImageMulterOptions } from '../core/cloudinary/multer.config';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Get alumni directory with optional search' })
    @ApiQuery({ name: 'search', required: false })
    findAll(@Query('search') search?: string) {
        return this.usersService.findAll(search);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get your own full profile' })
    getMe(@CurrentUser('id') userId: string) {
        return this.usersService.findOne(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific user profile' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update your own profile' })
    updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(userId, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a user profile (admin)' })
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Post('me/avatar')
    @ApiOperation({ summary: 'Upload your profile avatar' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @UseInterceptors(FileInterceptor('file', singleImageMulterOptions))
    uploadAvatar(
        @CurrentUser('id') userId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.usersService.uploadAvatar(userId, file);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user account' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
