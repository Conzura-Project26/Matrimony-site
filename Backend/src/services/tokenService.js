import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

class TokenService {
  /**
   * Generate access token (short-lived: 15 minutes)
   * @param {Object} payload - User data to include in token
   * @returns {string} - JWT access token
   */
  generateAccessToken(payload) {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
      }

      if (!payload || !payload.userId) {
        throw new Error('Invalid payload: userId is required');
      }

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '15m', // 15 minutes
      });

      console.log(`[TokenService] Access token generated for user: ${payload.userId}`);
      return token;
    } catch (error) {
      console.error('[TokenService] Error generating access token:', {
        payload: payload?.userId ? { userId: payload.userId } : 'invalid',
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  /**
   * Generate refresh token (long-lived: 7 days)
   * @returns {string} - Random refresh token
   */
  generateRefreshToken() {
    try {
      const token = crypto.randomBytes(64).toString('hex');
      console.log(`[TokenService] Refresh token generated: ${token.substring(0, 20)}...`);
      return token;
    } catch (error) {
      console.error('[TokenService] Error generating refresh token:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to generate refresh token: ${error.message}`);
    }
  }

  /**
   * Store refresh token in database
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<Object>} - Created refresh token record
   */
  async storeRefreshToken(userId, token) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      console.log(`[TokenService] Storing refresh token for user: ${userId}`);
      
      const refreshToken = await prisma.refreshToken.create({
        data: {
          user_id: userId,
          token,
          expires_at: expiresAt,
        },
      });

      console.log(`[TokenService] Refresh token stored successfully. Token ID: ${refreshToken.id}`);
      return refreshToken;
    } catch (error) {
      console.error('[TokenService] Error storing refresh token:', {
        userId,
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw new Error(`Failed to store refresh token: ${error.message}`);
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - Refresh token to verify
   * @returns {Promise<Object|null>} - Token record if valid, null otherwise
   */
  async verifyRefreshToken(token) {
    try {
      console.log(`[TokenService] Verifying refresh token: ${token.substring(0, 20)}...`);
      
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              mobile_number: true,
              is_active: true,
              role: {
                select: {
                  role_name: true,
                },
              },
            },
          },
        },
      });

      // Check if token exists
      if (!refreshToken) {
        console.log('[TokenService] Refresh token not found in database');
        return null;
      }

      // Check if token is revoked
      if (refreshToken.is_revoked) {
        console.log('[TokenService] Refresh token has been revoked');
        return null;
      }

      // Check if token is expired
      if (new Date() > refreshToken.expires_at) {
        console.log(`[TokenService] Refresh token expired at: ${refreshToken.expires_at}`);
        return null;
      }

      // Check if user is active
      if (!refreshToken.user.is_active) {
        console.log(`[TokenService] User account is inactive: ${refreshToken.user.id}`);
        return null;
      }

      console.log(`[TokenService] Refresh token verified successfully for user: ${refreshToken.user.id}`);
      return refreshToken;
    } catch (error) {
      console.error('[TokenService] Error verifying refresh token:', {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      return null;
    }
  }

  /**
   * Revoke a specific refresh token
   * @param {string} token - Token to revoke
   * @returns {Promise<boolean>} - Success status
   */
  async revokeToken(token) {
    try {
      console.log(`[TokenService] Revoking refresh token: ${token.substring(0, 20)}...`);
      
      await prisma.refreshToken.update({
        where: { token },
        data: { is_revoked: true },
      });
      
      console.log('[TokenService] Refresh token revoked successfully');
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        console.warn('[TokenService] Token not found for revocation (already deleted or invalid)');
        return true; // Idempotent - token doesn't exist, which is the desired state
      }
      
      console.error('[TokenService] Error revoking token:', {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of tokens revoked
   */
  async revokeAllUserTokens(userId) {
    try {
      console.log(`[TokenService] Revoking all refresh tokens for user: ${userId}`);
      
      const result = await prisma.refreshToken.updateMany({
        where: {
          user_id: userId,
          is_revoked: false,
        },
        data: {
          is_revoked: true,
        },
      });

      console.log(`[TokenService] Revoked ${result.count} refresh token(s) for user: ${userId}`);
      return result.count;
    } catch (error) {
      console.error('[TokenService] Error revoking all user tokens:', {
        userId,
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw new Error(`Failed to revoke all user tokens: ${error.message}`);
    }
  }

  /**
   * Clean up expired tokens (run periodically)
   * @returns {Promise<number>} - Number of tokens deleted
   */
  async cleanupExpiredTokens() {
    try {
      console.log('[TokenService] Starting cleanup of expired refresh tokens...');
      
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });

      console.log(`[TokenService] Cleanup completed. Deleted ${result.count} expired token(s)`);
      return result.count;
    } catch (error) {
      console.error('[TokenService] Error cleaning up expired tokens:', {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object
   * @returns {Promise<Object>} - { accessToken, refreshToken }
   */
  async generateTokenPair(user) {
    try {
      console.log(`[TokenService] Generating token pair for user: ${user.id}`);
      
      if (!user || !user.id) {
        throw new Error('Invalid user object: missing id');
      }

      const payload = {
        userId: user.id,
        mobile_number: user.mobile_number,
        role: user.role?.role_name || user.role,
      };

      console.log('[TokenService] Generating access token...');
      const accessToken = this.generateAccessToken(payload);
      
      console.log('[TokenService] Generating refresh token...');
      const refreshToken = this.generateRefreshToken();

      // Store refresh token in database
      console.log('[TokenService] Storing refresh token in database...');
      await this.storeRefreshToken(user.id, refreshToken);

      console.log('[TokenService] Token pair generated successfully');
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('[TokenService] Error generating token pair:', {
        userId: user?.id,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to generate token pair: ${error.message}`);
    }
  }
}

export default new TokenService();
