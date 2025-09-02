import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UpsertLuggageItemDto } from '../dto/upsert-luggage-item.dto';
import { LuggageItemsService } from '../services/luggage-items.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('luggage/:luggageId/items')
@UseGuards(JwtAuthGuard)
export class LuggageItemsController {
  constructor(private readonly luggageItemsService: LuggageItemsService) {}

  @Post(':itemId')
  upsert(
    @Param('luggageId', ParseUUIDPipe) luggageId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpsertLuggageItemDto,
    @CurrentUser() user: User,
  ) {
    return this.luggageItemsService.upsert(luggageId, itemId, dto);
  }

  @Get()
  findAll(
    @Param('luggageId', ParseUUIDPipe) luggageId: string,
    @CurrentUser() user: User,
  ) {
    return this.luggageItemsService.findAll(luggageId);
  }

  @Get(':itemId')
  findOne(
    @Param('luggageId', ParseUUIDPipe) luggageId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.luggageItemsService.findOne(luggageId, itemId);
  }

  @Delete(':itemId')
  remove(
    @Param('luggageId') luggageId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.luggageItemsService.remove(luggageId, itemId);
  }
}
