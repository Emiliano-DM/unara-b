import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from 'src/auth/decoradors/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest()
    const user = request.user
    const ValidRoles:string[] = this.reflector.get(META_ROLES, context.getHandler())

    if (!ValidRoles || ValidRoles.length === 0) return true

    if (!user || !user.roles){
      throw new ForbiddenException('User not found or has no roles assigned')
    }

    
    if(user.roles.some((role:string) => ValidRoles.includes(role))) return true
    throw new ForbiddenException(`User ${user.username} does not have sufficient permissions to access this resource`)


  }
}
