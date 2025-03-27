import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { MainAdminModule } from './main-admin/main-admin.module';
import { AuthModule } from './auth/auth.module';
import { Database } from './database/database.providers';

@Module({
  imports: [UserModule, AdminModule, MainAdminModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, Database],
  exports: [Database],
})
export class AppModule {}
