import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

@Injectable()
export class ProfileImageValidation implements PipeTransform<Express.Multer.File> {
  transform(value: Express.Multer.File | Express.Multer.File[]) {
    if (Array.isArray(value)){
      value.forEach(file => {
        if (file.size > 1 * 1024 * 1024){
          throw new BadRequestException('File too large')
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)){
          throw new BadRequestException('Invalid file mime type')
        }
      })
    }else {
      if (value.size > 1 * 1024 * 1024){
        throw new BadRequestException('File too large')
      }
      if (!ALLOWED_MIME_TYPES.includes(value.mimetype)){
        throw new BadRequestException('Invalid file mime type')
      }
    }
    return value
  }
}