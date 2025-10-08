  import { applyDecorators, UseGuards } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { UserRoleGuard } from '../guards/user-role/user-role.guard';
  import { RoleProtected } from './role-protected.decorator';
  import { ValidRoles } from '../enums/valid-roles.enum';

  export function Auth(...roles: ValidRoles[]) {
    return applyDecorators(
      RoleProtected(...roles),
      UseGuards(AuthGuard(), UserRoleGuard),
    );
  }  