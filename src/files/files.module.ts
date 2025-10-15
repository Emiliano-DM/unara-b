import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [
    TypeOrmModule.forFeature([File]),
    CloudinaryModule
  ],
  exports: [FilesService]
})
export class FilesModule {}
