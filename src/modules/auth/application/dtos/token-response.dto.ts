export class TokenResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  tokenType!: string;

  static create(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): TokenResponseDto {
    const dto = new TokenResponseDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.expiresIn = expiresIn;
    dto.tokenType = 'Bearer';
    return dto;
  }
}
