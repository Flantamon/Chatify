import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { SettingsSetService } from './settings-set.service';
import { CreateSettingsSetDto } from './dto/create-settings-set.dto';
import { UpdateSettingsSetDto } from './dto/update-settings-set.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { parseAcceptLanguage } from 'src/shared/utils/parse-accept-language';
import { RequestWithUser } from 'src/shared/interfaces/user-request.interface';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsSetController {
  constructor(private readonly settingsService: SettingsSetService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateSettingsSetDto,
    @Headers('accept-language') acceptLang: string,
  ) {
    const language = dto.language || parseAcceptLanguage(acceptLang);
    const user_id = req.user.id;
    return this.settingsService.create(user_id, { ...dto, language });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get('me')
  async findMySettings(@Req() req: RequestWithUser) {
    const user_id = req.user.id;
    return this.settingsService.findOne(user_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Patch('me')
  async updateMySettings(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateSettingsSetDto,
  ) {
    const user_id = req.user.id;
    return this.settingsService.update(user_id, dto);
  }

  // Может не нужно
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Delete('me')
  async remove(@Req() req: RequestWithUser) {
    const user_id = req.user.id;
    return this.settingsService.remove(user_id);
  }
}
