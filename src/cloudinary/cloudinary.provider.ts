import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import * as streamifier from 'streamifier'


@Injectable()
export class CloudinaryProvider{
    constructor(
        private readonly configService: ConfigService,

    ){
        cloudinary.config({
            cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'), 
            api_key: configService.get('CLOUDINARY_API_KEY'), 
            api_secret: configService.get('CLOUDINARY_API_SECRET')
        })
    }

    async uploadFile(file:Express.Multer.File){
        const data = await new Promise<any>((resolve, reject) => { const stream = cloudinary.uploader.upload_stream((error, result) => { if (error) reject(error); else resolve(result); }); 
             streamifier.createReadStream(file.buffer).pipe(stream); })
        return {
            url:data.secure_url,
            publicId: data.public_id
        }
    }

    async deleteFile(fileId: string, publicId: string){
        await cloudinary.uploader.destroy(publicId)
    }
}