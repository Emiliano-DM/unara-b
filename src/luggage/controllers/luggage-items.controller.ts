import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseFilters } from "@nestjs/common";
import { UpsertLuggageItemDto } from "../dto/upsert-luggage-item.dto";
import { LuggageItemsService } from "../services/luggage-items.service";
import { DatabaseExceptionFilter } from "src/common/filters/db-exception.filter";
import {ValidRoles} from 'src/auth/enums/valid-roles.enum';
import {Auth} from 'src/auth/decoradors/auth.decorador';

@UseFilters(new DatabaseExceptionFilter('LuggageItems'))
@Controller('luggage/:luggageId/items')
export class LuggageItemsController {
    constructor(private readonly luggageItemsService: LuggageItemsService) {}

    @Post(':itemId')
    @Auth(ValidRoles.user)
    upsert(
        @Param('luggageId', ParseUUIDPipe) luggageId: string, 
        @Param('itemId', ParseUUIDPipe) itemId: string, 
        @Body() dto: UpsertLuggageItemDto
    ) {
        return this.luggageItemsService.upsert(luggageId, itemId, dto);
    }
    
    @Get()
    @Auth(ValidRoles.user)
    findAll(@Param('luggageId', ParseUUIDPipe) luggageId: string) {
        return this.luggageItemsService.findAll(luggageId);
    }
    
    @Get(':itemId')
    @Auth(ValidRoles.user)
    findOne(
        @Param('luggageId', ParseUUIDPipe) luggageId: string,
        @Param('itemId', ParseUUIDPipe) itemId: string
    ) {
        return this.luggageItemsService.findOne(luggageId, itemId);
    }

    @Delete(':itemId')
    @Auth(ValidRoles.user)
    remove(
        @Param('luggageId') luggageId: string,
        @Param('itemId') itemId: string
    ) {
        return this.luggageItemsService.remove(luggageId, itemId);
    }
}
