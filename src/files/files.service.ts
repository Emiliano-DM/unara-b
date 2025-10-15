import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { CloudinaryProvider } from 'src/cloudinary/cloudinary.provider';


@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository:Repository<File>,
    private readonly cloudinaryProvider: CloudinaryProvider
  ){}
  async saveFileMetadata(url:string, user:User, entityType: string, fileSize:number, mimeType:string, cloudinaryPublicId:string, entityId?:string, isPrivate?:boolean){
    const file = this.fileRepository.create({
      url,
      user,
      entity_type: entityType,
      file_size: fileSize,
      mime_type: mimeType,
      cloudinary_public_id: cloudinaryPublicId,
      entity_id: entityId,
      is_private: isPrivate
    })
    return await this.fileRepository.save(file)
  }

  async deleteFileMetadata(fileId:string, userId:string){
    const file = await this.fileRepository.findOne({where: {id:fileId}, relations: { user:true}})
    if (!file){
      throw new NotFoundException('File not found')
    }
    if (file.user.id !== userId){
      throw new UnauthorizedException('Only the user that created the file can delete it')
    }
    await this.fileRepository.remove(file)
    return file.cloudinary_public_id
  }

  async deleteFileComplete(fileId:string, userId:string) {
    const publicId = await this.deleteFileMetadata(fileId, userId)
    return this.cloudinaryProvider.deleteFile(fileId, publicId)
  }
}
