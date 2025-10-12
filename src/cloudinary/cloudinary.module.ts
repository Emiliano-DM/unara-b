import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
    providers:[CloudinaryProvider],
    imports: [
        ConfigModule,
    ],
    exports: [CloudinaryProvider]
})
export class CloudinaryModule {}
