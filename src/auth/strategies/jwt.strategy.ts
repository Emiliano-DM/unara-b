import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "src/users/entities/user.entity";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        configService:ConfigService,
        @InjectRepository( User )
        private readonly userRepository: Repository<User>
    ){
        if (!configService.get('JWT_ACCESS_SECRET')) throw new Error('JWT_ACCESS_SECRET must be defined'); 
        super({
            secretOrKey: configService.get('JWT_ACCESS_SECRET') as string,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
            ignoreExpiration:false
        })
        
    }

    async validate( payload: JwtPayload): Promise<User> {
        const {id, email} = payload;

        const user = await this.userRepository.findOneBy({id})

        if (!user)
            throw new UnauthorizedException('Token not valid')
        return user;
    }
}