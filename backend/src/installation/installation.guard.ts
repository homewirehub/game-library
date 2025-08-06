import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InstallationService } from './installation.service';

export const SKIP_INSTALLATION_CHECK = 'skipInstallationCheck';
export const SkipInstallationCheck = () => Reflector.createDecorator<boolean>();

@Injectable()
export class InstallationGuard implements CanActivate {
  constructor(
    private readonly installationService: InstallationService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_INSTALLATION_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCheck) {
      return true;
    }

    const isInstalled = await this.installationService.isInstalled();
    
    if (!isInstalled) {
      const request = context.switchToHttp().getRequest();
      const url = request.url;
      
      // Allow installation endpoints
      if (url.startsWith('/api/installation')) {
        return true;
      }
      
      // Redirect to installation page for all other requests
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'System requires installation',
          redirectTo: '/install',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return true;
  }
}
