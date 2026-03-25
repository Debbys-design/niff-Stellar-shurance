import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload, StaffRole, LoginResponse } from '../types';
import config from '../config';

/**
 * JWT Service - handles JWT token generation and validation
 */
export class JwtService {
  /**
   * Generate access and refresh tokens
   */
  generateTokens(user: { id: string; email: string; role: StaffRole }): LoginResponse {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: config.security.tokenExpiryHours * 3600,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Generate access token
   */
  generateAccessToken(user: { id: string; email: string; role: StaffRole }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const options: SignOptions = {
      expiresIn: 3600, // 1 hour in seconds
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    };

    return jwt.sign(payload, config.jwt.secret, options);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user: { id: string; email: string; role: StaffRole }): string {
    const payload = {
      sub: user.id,
      type: 'refresh',
    };

    const options: SignOptions = {
      expiresIn: 604800, // 7 days in seconds
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    };

    return jwt.sign(payload, config.jwt.secret, options);
  }

  /**
   * Verify access token and return payload
   */
  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JwtPayload;
  }

  /**
   * Verify refresh token and return payload
   */
  verifyRefreshToken(token: string): { sub: string; type: string } {
    return jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as { sub: string; type: string };
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string): { accessToken: string; expiresIn: number } | null {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      
      if (payload.type !== 'refresh') {
        return null;
      }

      // In production, you would fetch the user from database
      // For now, we'll just return null if we can't find the user
      // This is a simplified implementation
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    const decoded = jwt.decode(token);
    return decoded as JwtPayload | null;
  }
}

export const jwtService = new JwtService();
export default jwtService;