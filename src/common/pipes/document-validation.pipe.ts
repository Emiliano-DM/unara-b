import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

const ALLOWED_MIME_TYPES = ['application/pdf', 'application/msword','image/jpeg', 'image/png']

@Injectable()
export class DocumentValidation implements PipeTransform<Express.Multer.File> {
  transform(value: Express.Multer.File | Express.Multer.File[]) {
    // Handle missing files
    if (!value) {
      throw new BadRequestException('No file provided');
    }

    // Handle empty arrays
    if (Array.isArray(value) && value.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (Array.isArray(value)){
      value.forEach(file => {
        if (!file) {
          throw new BadRequestException('Invalid file data');
        }
        if (file.size > 10 * 1024 * 1024){
          throw new BadRequestException('File too large')
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)){
          throw new BadRequestException('Invalid file mime type')
        }
      })
    }else {
      if (value.size > 10 * 1024 * 1024){
        throw new BadRequestException('File too large')
      }
      if (!ALLOWED_MIME_TYPES.includes(value.mimetype)){
        throw new BadRequestException('Invalid file mime type')
      }
    }
    return value
  }
}