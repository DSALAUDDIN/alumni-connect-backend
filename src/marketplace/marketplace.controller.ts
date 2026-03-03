import { Controller, Get, Post, Delete, Param, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateMarketplaceItemDto } from './dto/create-item.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { multiImageMulterOptions } from '../core/cloudinary/multer.config';

@ApiTags('Marketplace')
@ApiBearerAuth('access-token')
@Controller('marketplace')
export class MarketplaceController {
    constructor(private readonly marketplaceService: MarketplaceService) { }

    @Post()
    @ApiOperation({ summary: 'List a new item for sale (supports image upload)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                files: { type: 'array', items: { type: 'string', format: 'binary' } },
            },
            required: ['title', 'description', 'price'],
        },
    })
    @UseInterceptors(FilesInterceptor('files', 5, multiImageMulterOptions))
    create(
        @Body() dto: CreateMarketplaceItemDto,
        @CurrentUser('id') userId: string,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        return this.marketplaceService.create(userId, dto, files);
    }

    @Get()
    @ApiOperation({ summary: 'Browse marketplace listings' })
    findAll() {
        return this.marketplaceService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a marketplace listing detail' })
    findOne(@Param('id') id: string) {
        return this.marketplaceService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove a marketplace listing' })
    remove(@Param('id') id: string) {
        return this.marketplaceService.remove(id);
    }
}
