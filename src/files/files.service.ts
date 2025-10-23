import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { CloudinaryProvider } from 'src/cloudinary/cloudinary.provider';
import { EventsGateway } from 'src/events/events.gateway';


@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository:Repository<File>,
    private readonly cloudinaryProvider: CloudinaryProvider,
    private readonly eventsGateway: EventsGateway,
  ){}
  async saveFileMetadata(
    url:string,
    user:User,
    entityType: string,
    fileSize:number,
    mimeType:string,
    cloudinaryPublicId:string,
    entityId?:string,
    isPrivate?:boolean,
    category?:string,
    transportType?:string,
    fileName?:string
  ){
    const file = this.fileRepository.create({
      url,
      user,
      entity_type: entityType,
      file_size: fileSize,
      mime_type: mimeType,
      cloudinary_public_id: cloudinaryPublicId,
      entity_id: entityId,
      is_private: isPrivate,
      category,
      transport_type: transportType,
      file_name: fileName,
    })
    const savedFile = await this.fileRepository.save(file);

    // Emit WebSocket event if this is a trip document
    if (entityType === 'trip_files' && entityId) {
      this.eventsGateway.emitDocumentUploaded(entityId, user.id, {
        fileId: savedFile.id,
        fileName: fileName || 'document',
        category,
        transportType,
        url: savedFile.url,
        userId: user.id,
      });
    }

    return savedFile;
  }

  async deleteFileMetadata(fileId:string, userId:string){
    const file = await this.fileRepository.findOne({where: {id:fileId}, relations: { user:true}})
    if (!file){
      throw new NotFoundException('File not found')
    }
    if (file.user.id !== userId){
      throw new UnauthorizedException('Only the user that created the file can delete it')
    }

    // Emit WebSocket event if this is a trip document
    if (file.entity_type === 'trip_files' && file.entity_id) {
      this.eventsGateway.emitDocumentDeleted(file.entity_id, userId, {
        fileId: file.id,
        fileName: file.file_name || 'document',
        category: file.category,
        transportType: file.transport_type,
        url: file.url,
        userId,
      });
    }

    await this.fileRepository.remove(file)
    return file.cloudinary_public_id
  }

  async getUserFiles(userId: string){
    return await this.fileRepository.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' }
    })
  }

  async getTripFiles(tripId: string, category?: string, transportType?: string){
    const where: any = {
      entity_type: 'trip_files',
      entity_id: tripId
    };

    if (category) {
      where.category = category;
    }

    if (transportType) {
      where.transport_type = transportType;
    }

    return await this.fileRepository.find({
      where,
      relations: ['user'],
      order: { created_at: 'DESC' }
    });
  }

  async findByUrlAndUser(url: string, userId: string){
    return await this.fileRepository.findOne({
      where: { url, user: { id: userId } }
    })
  }

  async deleteFileComplete(fileId:string, userId:string) {
    const publicId = await this.deleteFileMetadata(fileId, userId)
    return this.cloudinaryProvider.deleteFile(fileId, publicId)
  }
}
