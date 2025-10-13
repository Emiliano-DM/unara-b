import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { FilesModule } from 'src/files/files.module';


@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    TypeOrmModule.forFeature([ User ]),
    PassportModule.register({defaultStrategy:'jwt'}),
    CloudinaryModule,
    FilesModule
  ],
  exports: [UsersService]
})
export class UsersModule {}
