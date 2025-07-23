const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt  = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const appleAuth = require('apple-signin-auth');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);


exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // 1) Try to find an existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // 2) If found by email but no googleId yet, attach it
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // 3) Otherwise create brand-new user
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
      });
    }

    // 4) Issue a JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({
      message: 'Logged in with Google',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Google login error', err);
    // If duplicate key (11000) still slips through, catch and return 409:
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email or Google ID already in use' });
    }
    return res.status(400).json({ message: 'Google login failed' });
  }
};

// 2) Apple
exports.appleLogin = async (req, res) => {
  try {
    const { identityToken } = req.body;
    const applePayload = await appleAuth.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID,
    });
    const { sub: appleId, email } = applePayload;

    let user = await User.findOne({ appleId });
    if (!user) {
      user = await User.create({ email, appleId, name: email.split('@')[0] });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Apple login failed' });
  }
};

