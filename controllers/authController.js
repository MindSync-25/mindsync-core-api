const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt  = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const appleAuth = require('apple-signin-auth');
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID  = process.env.APPLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);


// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, confirmPassword } = req.body;

//     // Validation
//     if (!name || !email || !password || !confirmPassword) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: 'Passwords do not match' });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({ message: 'Email already in use' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = new User({
//       name,
//       email,
//       password: hashedPassword
//     });

//     await user.save();

//     res.status(201).json({ message: 'User registered successfully!' });
//   } catch (error) {
//     console.error('Register Error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
exports.register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name||!email||!password||password!==confirmPassword) {
    return res.status(400).json({ message: 'All fields required & passwords must match' });
  }
  // 1) Check existing
  const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (rows.length) return res.status(409).json({ message: 'Email already in use' });

  // 2) Insert
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3)`,
    [name,email,hash]
  );
  res.status(201).json({ message: 'Registered successfully' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  // 1) Find user
  const { rows } = await pool.query(
    'SELECT id, name, password_hash FROM users WHERE email=$1',
    [email]
  );
  if (!rows.length) return res.status(401).json({ message: 'Invalid email or password' });

  const user = rows[0];
  // 2) Check password
  if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  // 3) Issue JWT
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Logged in successfully', token, user: { id: user.id, name: user.name, email } });
};

// exports.googleLogin = async (req, res) => {
//   try {
//     const { idToken } = req.body;
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: GOOGLE_CLIENT_ID,
//     });
//     const { sub: googleId, email, name, picture } = ticket.getPayload();

//     // 1) Try to find an existing user by googleId or email
//     let user = await User.findOne({
//       $or: [{ googleId }, { email }],
//     });

//     if (user) {
//       // 2) If found by email but no googleId yet, attach it
//       if (!user.googleId) {
//         user.googleId = googleId;
//         await user.save();
//       }
//     } else {
//       // 3) Otherwise create brand-new user
//       user = await User.create({
//         name,
//         email,
//         googleId,
//         avatar: picture,
//       });
//     }

//     // 4) Issue a JWT
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     return res.json({
//       message: 'Logged in with Google',
//       token,
//       user: { id: user._id, name: user.name, email: user.email },
//     });
//   } catch (err) {
//     console.error('Google login error', err);
//     // If duplicate key (11000) still slips through, catch and return 409:
//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'Email or Google ID already in use' });
//     }
//     return res.status(400).json({ message: 'Google login failed' });
//   }
// };

// // 2) Apple
// exports.appleLogin = async (req, res) => {
//   try {
//     const { identityToken } = req.body;
//     const applePayload = await appleAuth.verifyIdToken(identityToken, {
//       audience: process.env.APPLE_CLIENT_ID,
//     });
//     const { sub: appleId, email } = applePayload;

//     let user = await User.findOne({ appleId });
//     if (!user) {
//       user = await User.create({ email, appleId, name: email.split('@')[0] });
//     }
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
//     res.json({ token, user });
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ message: 'Apple login failed' });
//   }
// };

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken, audience: GOOGLE_CLIENT_ID
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Upsert by google_id or email
    let { rows } = await pool.query(
      'SELECT id FROM users WHERE google_id=$1 OR email=$2',
      [googleId, email]
    );
    let userId;
    if (rows.length) {
      userId = rows[0].id;
      // attach google_id if missing
      await pool.query(
        'UPDATE users SET google_id = $1 WHERE id = $2',
        [googleId, userId]
      );
    } else {
      const insert = await pool.query(
        `INSERT INTO users (name,email,google_id,avatar) 
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [name,email,googleId,picture]
      );
      userId = insert.rows[0].id;
    }
    // Issue JWT
    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Logged in with Google', token, user: { id: userId, name, email } });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Google login failed' });
  }
};

exports.appleLogin = async (req, res) => {
  try {
    const { identityToken } = req.body;
    const payload = await appleAuth.verifyIdToken(identityToken, {
      audience: APPLE_CLIENT_ID,
    });
    const { sub: appleId, email } = payload;

    let { rows } = await pool.query(
      'SELECT id FROM users WHERE apple_id=$1 OR email=$2',
      [appleId, email]
    );
    let userId;
    if (rows.length) {
      userId = rows[0].id;
      await pool.query('UPDATE users SET apple_id=$1 WHERE id=$2', [appleId, userId]);
    } else {
      const insert = await pool.query(
        `INSERT INTO users (email,apple_id,name) VALUES ($1,$2,$3) RETURNING id`,
        [email,appleId,email.split('@')[0]]
      );
      userId = insert.rows[0].id;
    }
    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Logged in with Apple', token, user: { id: userId, email } });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Apple login failed' });
  }
};

