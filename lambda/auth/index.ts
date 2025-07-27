import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

interface DatabaseCredentials {
  username: string;
  password: string;
  engine: string;
  host: string;
  port: number;
  dbname: string;
  dbInstanceIdentifier: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  google_id?: string;
  apple_id?: string;
  created_at: Date;
  updated_at: Date;
}

let dbPool: Pool | null = null;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Initialize database connection
async function initDatabase(): Promise<Pool> {
  if (dbPool) {
    return dbPool;
  }

  try {
    const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
    const secretValue = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN })
    );

    const credentials: DatabaseCredentials = JSON.parse(secretValue.SecretString!);

    dbPool = new Pool({
      host: credentials.host,
      port: credentials.port,
      database: credentials.dbname,
      user: credentials.username,
      password: credentials.password,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    return dbPool;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw new Error('Database connection failed');
  }
}

// Helper function to create response
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Device-Type,X-App-Version',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

// Generate JWT token
function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Register user
async function registerUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const db = await initDatabase();
    const { email, password, name } = JSON.parse(event.body || '{}');

    if (!email || !password || !name) {
      return createResponse(400, {
        success: false,
        error: 'Email, password, and name are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return createResponse(409, {
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, name, password_hash, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING id, email, name, created_at`,
      [email, name, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return createResponse(201, {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      },
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      code: 'REGISTRATION_FAILED'
    });
  }
}

// Login user
async function loginUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const db = await initDatabase();
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return createResponse(400, {
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user
    const result = await db.query(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return createResponse(401, {
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return createResponse(401, {
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const token = generateToken(user);

    return createResponse(200, {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      code: 'LOGIN_FAILED'
    });
  }
}

// Google OAuth login
async function googleLogin(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const db = await initDatabase();
    const { googleId, email, name } = JSON.parse(event.body || '{}');

    if (!googleId || !email || !name) {
      return createResponse(400, {
        success: false,
        error: 'Google ID, email, and name are required',
        code: 'MISSING_GOOGLE_DATA'
      });
    }

    // Check if user exists by Google ID
    let result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    
    let user;
    if (result.rows.length === 0) {
      // Check if user exists by email
      result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        // Create new user
        result = await db.query(
          `INSERT INTO users (email, name, google_id, created_at, updated_at) 
           VALUES ($1, $2, $3, NOW(), NOW()) 
           RETURNING id, email, name, created_at`,
          [email, name, googleId]
        );
      } else {
        // Update existing user with Google ID
        result = await db.query(
          `UPDATE users SET google_id = $1, updated_at = NOW() 
           WHERE email = $2 
           RETURNING id, email, name, created_at`,
          [googleId, email]
        );
      }
    }

    user = result.rows[0];
    const token = generateToken(user);

    return createResponse(200, {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      },
      message: 'Google login successful'
    });

  } catch (error) {
    console.error('Google login error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      code: 'GOOGLE_LOGIN_FAILED'
    });
  }
}

// Apple OAuth login
async function appleLogin(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const db = await initDatabase();
    const { appleId, email, name } = JSON.parse(event.body || '{}');

    if (!appleId) {
      return createResponse(400, {
        success: false,
        error: 'Apple ID is required',
        code: 'MISSING_APPLE_DATA'
      });
    }

    // Check if user exists by Apple ID
    let result = await db.query('SELECT * FROM users WHERE apple_id = $1', [appleId]);
    
    let user;
    if (result.rows.length === 0) {
      // Check if user exists by email (if provided)
      if (email) {
        result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      }
      
      if (result.rows.length === 0) {
        // Create new user
        result = await db.query(
          `INSERT INTO users (email, name, apple_id, created_at, updated_at) 
           VALUES ($1, $2, $3, NOW(), NOW()) 
           RETURNING id, email, name, created_at`,
          [email || null, name || 'Apple User', appleId]
        );
      } else {
        // Update existing user with Apple ID
        result = await db.query(
          `UPDATE users SET apple_id = $1, updated_at = NOW() 
           WHERE email = $2 
           RETURNING id, email, name, created_at`,
          [appleId, email]
        );
      }
    }

    user = result.rows[0];
    const token = generateToken(user);

    return createResponse(200, {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      },
      message: 'Apple login successful'
    });

  } catch (error) {
    console.error('Apple login error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      code: 'APPLE_LOGIN_FAILED'
    });
  }
}

// Get user profile
async function getUserProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse(401, {
        success: false,
        error: 'Authorization token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return createResponse(401, {
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    const db = await initDatabase();
    const result = await db.query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return createResponse(404, {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    return createResponse(200, {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }
      },
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
}

// Update user profile
async function updateUserProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse(401, {
        success: false,
        error: 'Authorization token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return createResponse(401, {
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    const { name, email } = JSON.parse(event.body || '{}');

    if (!name && !email) {
      return createResponse(400, {
        success: false,
        error: 'At least one field (name or email) is required',
        code: 'MISSING_UPDATE_FIELDS'
      });
    }

    const db = await initDatabase();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    if (name) {
      updateFields.push(`name = $${paramCounter++}`);
      values.push(name);
    }

    if (email) {
      updateFields.push(`email = $${paramCounter++}`);
      values.push(email);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(decoded.userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter} 
      RETURNING id, email, name, created_at, updated_at
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return createResponse(404, {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    return createResponse(200, {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      code: 'PROFILE_UPDATE_FAILED'
    });
  }
}

// Refresh token
async function refreshToken(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { token: oldToken } = JSON.parse(event.body || '{}');

    if (!oldToken) {
      return createResponse(400, {
        success: false,
        error: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    const decoded = verifyToken(oldToken);
    
    if (!decoded) {
      return createResponse(401, {
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const db = await initDatabase();
    const result = await db.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return createResponse(404, {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];
    const newToken = generateToken(user);

    return createResponse(200, {
      success: true,
      data: {
        token: newToken,
      },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      code: 'TOKEN_REFRESH_FAILED'
    });
  }
}

// Main handler
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Auth service event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { message: 'CORS preflight' });
  }

  try {
    const path = event.path;
    const method = event.httpMethod;

    // Route to appropriate handler
    if (path.includes('/register') && method === 'POST') {
      return await registerUser(event);
    }
    
    if (path.includes('/login') && method === 'POST') {
      return await loginUser(event);
    }
    
    if (path.includes('/google') && method === 'POST') {
      return await googleLogin(event);
    }
    
    if (path.includes('/apple') && method === 'POST') {
      return await appleLogin(event);
    }
    
    if (path.includes('/refresh') && method === 'POST') {
      return await refreshToken(event);
    }
    
    if (path.includes('/profile') && method === 'GET') {
      return await getUserProfile(event);
    }
    
    if (path.includes('/profile') && method === 'PUT') {
      return await updateUserProfile(event);
    }

    return createResponse(404, {
      success: false,
      error: 'Endpoint not found',
      code: 'ENDPOINT_NOT_FOUND'
    });

  } catch (error) {
    console.error('Handler error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      code: 'HANDLER_ERROR'
    });
  }
};
