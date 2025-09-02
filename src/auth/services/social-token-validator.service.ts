import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialUserInfo, GoogleUserInfo, FacebookUserInfo, AppleUserInfo, MicrosoftUserInfo } from '../interfaces/social-user-info.interface';

@Injectable()
export class SocialTokenValidatorService {
  private readonly logger = new Logger(SocialTokenValidatorService.name);

  constructor(private configService: ConfigService) {}

  async validateToken(
    provider: string,
    accessToken: string,
    userInfo: SocialUserInfo,
  ): Promise<boolean> {
    try {
      switch (provider) {
        case 'google':
          return await this.validateGoogleToken(accessToken, userInfo as GoogleUserInfo);
        case 'facebook':
          return await this.validateFacebookToken(accessToken, userInfo as FacebookUserInfo);
        case 'apple':
          return await this.validateAppleToken(accessToken, userInfo as AppleUserInfo);
        case 'microsoft':
          return await this.validateMicrosoftToken(accessToken, userInfo as MicrosoftUserInfo);
        default:
          this.logger.warn(`Unsupported social provider: ${provider}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Social token validation failed for ${provider}:`, error);
      return false;
    }
  }

  private async validateGoogleToken(
    accessToken: string,
    userInfo: GoogleUserInfo,
  ): Promise<boolean> {
    try {
      // Validate with Google's tokeninfo endpoint
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
      );

      if (!response.ok) {
        this.logger.warn('Google token validation failed - invalid token');
        return false;
      }

      const tokenData = await response.json() as any;

      // Verify the token is for our application
      const expectedClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (expectedClientId && tokenData.audience !== expectedClientId) {
        this.logger.warn('Google token validation failed - wrong audience');
        return false;
      }

      // Verify user email matches
      if (tokenData.email !== userInfo.email) {
        this.logger.warn('Google token validation failed - email mismatch');
        return false;
      }

      // Verify email is verified
      if (!tokenData.verified_email) {
        this.logger.warn('Google token validation failed - email not verified');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Google token validation error:', error);
      return false;
    }
  }

  private async validateFacebookToken(
    accessToken: string,
    userInfo: FacebookUserInfo,
  ): Promise<boolean> {
    try {
      const appId = this.configService.get<string>('FACEBOOK_APP_ID');
      const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

      if (!appId || !appSecret) {
        this.logger.warn('Facebook validation failed - missing app credentials');
        return false;
      }

      // Validate with Facebook's debug_token endpoint
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`,
      );

      if (!response.ok) {
        this.logger.warn('Facebook token validation failed - invalid token');
        return false;
      }

      const result = await response.json() as any;
      const tokenData = result.data;

      if (!tokenData.is_valid) {
        this.logger.warn('Facebook token validation failed - token is invalid');
        return false;
      }

      if (tokenData.app_id !== appId) {
        this.logger.warn('Facebook token validation failed - wrong app_id');
        return false;
      }

      // Get user data to verify email
      const userResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,email&access_token=${accessToken}`,
      );

      if (!userResponse.ok) {
        this.logger.warn('Facebook user data fetch failed');
        return false;
      }

      const userData = await userResponse.json() as any;

      if (userData.email !== userInfo.email || userData.id !== userInfo.id) {
        this.logger.warn('Facebook token validation failed - user data mismatch');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Facebook token validation error:', error);
      return false;
    }
  }

  private async validateAppleToken(
    accessToken: string,
    userInfo: AppleUserInfo,
  ): Promise<boolean> {
    try {
      // Apple uses ID tokens (JWT), not access tokens
      // For production, you would validate the JWT signature with Apple's public keys
      // This is a simplified validation - implement full JWT validation for production
      
      const parts = accessToken.split('.');
      if (parts.length !== 3) {
        this.logger.warn('Apple token validation failed - invalid JWT format');
        return false;
      }

      // Decode the payload (without verification for now - implement proper JWT validation)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      // Verify issuer
      if (payload.iss !== 'https://appleid.apple.com') {
        this.logger.warn('Apple token validation failed - wrong issuer');
        return false;
      }

      // Verify audience (your client ID)
      const expectedClientId = this.configService.get<string>('APPLE_CLIENT_ID');
      if (expectedClientId && payload.aud !== expectedClientId) {
        this.logger.warn('Apple token validation failed - wrong audience');
        return false;
      }

      // Verify email matches
      if (payload.email !== userInfo.email || payload.sub !== userInfo.sub) {
        this.logger.warn('Apple token validation failed - user data mismatch');
        return false;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        this.logger.warn('Apple token validation failed - token expired');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Apple token validation error:', error);
      return false;
    }
  }

  private async validateMicrosoftToken(
    accessToken: string,
    userInfo: MicrosoftUserInfo,
  ): Promise<boolean> {
    try {
      // Validate with Microsoft Graph API
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn('Microsoft token validation failed - invalid token');
        return false;
      }

      const userData = await response.json() as any;

      // Verify user data matches
      if (userData.mail !== userInfo.email && userData.userPrincipalName !== userInfo.email) {
        this.logger.warn('Microsoft token validation failed - email mismatch');
        return false;
      }

      if (userData.id !== userInfo.id) {
        this.logger.warn('Microsoft token validation failed - ID mismatch');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Microsoft token validation error:', error);
      return false;
    }
  }
}