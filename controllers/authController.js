const User = require('../models/User');
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
  if (!name || !email || !password || password !== confirmPassword) {
    return res.status(400).json({ message: 'All fields required & passwords must match' });
  }
  try {
    // Check if user exists
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    // Hash password
    const hash = await bcrypt.hash(password, 12);
    // Create user (UUID primary key)
    const user = await User.create({ name, email, password: hash });
    res.status(201).json({
      message: 'Registered successfully',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const responseData = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
    console.log('Login response:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
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
  console.log('Google login endpoint called with body:', req.body);
  try {
    const { idToken } = req.body;
    // Use the correct OAuth2Client instance
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Upsert by google_id or email
    let { rows } = await pool.query(
      'SELECT id, name, email FROM public.users WHERE google_id=$1 OR email=$2',
      [googleId, email]
    );
    let userId, userName, userEmail;
    if (rows.length) {
      userId = rows[0].id;
      userName = rows[0].name;
      userEmail = rows[0].email;
      // attach google_id if missing
      await pool.query(
        'UPDATE public.users SET google_id = $1 WHERE id = $2',
        [googleId, userId]
      );
    } else {
      const insert = await pool.query(
        `INSERT INTO public.users (name,email,google_id,avatar) 
         VALUES ($1,$2,$3,$4) RETURNING id, name, email`,
        [name, email, googleId, picture]
      );
      userId = insert.rows[0].id;
      userName = insert.rows[0].name;
      userEmail = insert.rows[0].email;
    }
    // Issue JWT
    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
    const responseData = {
      token,
      user: {
        id: userId,
        name: userName,
        email: userEmail
      }
    };
    console.log('Google login response:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('Google login error:', err);
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
      'SELECT id FROM public.users WHERE apple_id=$1 OR email=$2',
      [appleId, email]
    );
    let userId;
    if (rows.length) {
      userId = rows[0].id;
      await pool.query('UPDATE public.users SET apple_id=$1 WHERE id=$2', [appleId, userId]);
    } else {
      const insert = await pool.query(
        `INSERT INTO public.users (email,apple_id,name) VALUES ($1,$2,$3) RETURNING id`,
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

