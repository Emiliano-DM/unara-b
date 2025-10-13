import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';


@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository:Repository<File>
  ){}
  async saveFileMetadata(url:string, user:User, entityType: string, fileSize:number, mimeType:string, cloudinaryPublicId:string, entityId?:string){
    const file = this.fileRepository.create({
      url,
      user,
      entity_type: entityType,
      file_size: fileSize,
      mime_type: mimeType,
      cloudinary_public_id: cloudinaryPublicId,
      entity_id: entityId

    })
    return await this.fileRepository.save(file)
  }
}
