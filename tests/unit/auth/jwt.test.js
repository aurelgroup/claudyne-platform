/**
 * Tests unitaires - Système JWT
 * Tests de génération, validation et sécurité des tokens JWT
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('JWT Authentication System', () => {
  let testUser;
  let validToken;
  let expiredToken;

  beforeEach(() => {
    testUser = {
      id: 'user-123',
      email: 'test@claudyne.com',
      role: 'student',
      clientType: 'mobile'
    };

    validToken = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });
    expiredToken = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '-1h' });
  });

  describe('Token Generation', () => {
    test('should generate valid JWT token', () => {
      const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // Header.Payload.Signature
    });

    test('should include user data in token payload', () => {
      const decoded = jwt.verify(validToken, process.env.JWT_SECRET);

      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
      expect(decoded.clientType).toBe(testUser.clientType);
    });

    test('should set correct expiration time', () => {
      const decoded = jwt.verify(validToken, process.env.JWT_SECRET);
      const now = Math.floor(Date.now() / 1000);

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + 3600); // 1 hour
    });

    test('should generate different tokens for same user', () => {
      const token1 = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });
      const token2 = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });

      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Validation', () => {
    test('should validate correct token', () => {
      expect(() => {
        jwt.verify(validToken, process.env.JWT_SECRET);
      }).not.toThrow();
    });

    test('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET);
      }).toThrow();
    });

    test('should reject expired token', () => {
      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow(jwt.TokenExpiredError);
    });

    test('should reject token with wrong secret', () => {
      const wrongSecretToken = jwt.sign(testUser, 'wrong-secret', { expiresIn: '1h' });

      expect(() => {
        jwt.verify(wrongSecretToken, process.env.JWT_SECRET);
      }).toThrow(jwt.JsonWebTokenError);
    });

    test('should reject malformed token', () => {
      const malformedToken = 'header.payload'; // Missing signature

      expect(() => {
        jwt.verify(malformedToken, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Token Security', () => {
    test('should use strong secret key', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
      expect(process.env.JWT_SECRET).not.toBe('secret');
      expect(process.env.JWT_SECRET).not.toBe('test');
    });

    test('should not include sensitive data in payload', () => {
      const userWithPassword = {
        ...testUser,
        password: 'secret123',
        hashedPassword: '$2b$10$abc123'
      };

      const token = jwt.sign(userWithPassword, process.env.JWT_SECRET, { expiresIn: '1h' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.password).toBeUndefined();
      expect(decoded.hashedPassword).toBeUndefined();
    });

    test('should validate token structure', () => {
      const decoded = jwt.verify(validToken, process.env.JWT_SECRET);

      // Vérifier les champs obligatoires
      expect(decoded.id).toBeDefined();
      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.exp).toBeDefined(); // Expires at

      // Vérifier les types
      expect(typeof decoded.id).toBe('string');
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
    });
  });

  describe('Role-based Access', () => {
    test('should create tokens with different roles', () => {
      const roles = ['student', 'parent', 'admin', 'teacher'];

      roles.forEach(role => {
        const user = { ...testUser, role };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        expect(decoded.role).toBe(role);
      });
    });

    test('should validate role format', () => {
      const validRoles = ['student', 'parent', 'admin', 'teacher'];
      const decoded = jwt.verify(validToken, process.env.JWT_SECRET);

      expect(validRoles).toContain(decoded.role);
    });
  });

  describe('Client Type Validation', () => {
    test('should support different client types', () => {
      const clientTypes = ['mobile', 'web', 'api'];

      clientTypes.forEach(clientType => {
        const user = { ...testUser, clientType };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        expect(decoded.clientType).toBe(clientType);
      });
    });
  });

  describe('Token Refresh', () => {
    test('should create refresh token with longer expiry', () => {
      const refreshToken = jwt.sign(
        { id: testUser.id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const now = Math.floor(Date.now() / 1000);

      expect(decoded.type).toBe('refresh');
      expect(decoded.exp).toBeGreaterThan(now + 86400); // > 1 day
    });

    test('should differentiate access and refresh tokens', () => {
      const accessToken = jwt.sign(
        { ...testUser, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { id: testUser.id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const accessDecoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      expect(accessDecoded.type).toBe('access');
      expect(refreshDecoded.type).toBe('refresh');
      expect(accessDecoded.exp).toBeLessThan(refreshDecoded.exp);
    });
  });
});