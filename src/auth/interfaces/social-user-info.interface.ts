export interface SocialUserInfo {
  id?: string;
  sub?: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  verified_email?: boolean;
}

export interface GoogleUserInfo extends SocialUserInfo {
  sub: string;
  email_verified: boolean;
  picture: string;
}

export interface FacebookUserInfo extends SocialUserInfo {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface AppleUserInfo extends SocialUserInfo {
  sub: string;
  email_verified?: boolean;
}

export interface MicrosoftUserInfo extends SocialUserInfo {
  id: string;
  userPrincipalName?: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
}