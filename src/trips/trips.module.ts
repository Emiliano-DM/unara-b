import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  controllers: [TripsController],
  providers: [TripsService],
  imports: [
    TypeOrmModule.forFeature([ Trip, User ]),
    AuthModule,
    FilesModule,
    CloudinaryModule
  ]
})
export class TripsModule {}
