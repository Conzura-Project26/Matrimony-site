const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { full_name, gender, date_of_birth, mobile_number, email, password, profile_created_by, role_name } = req.body;
    const role = await prisma.role.findUnique({ where: { role_name } });
    if (!role) return res.status(400).json({ error: 'Invalid role' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        full_name,
        gender,
        date_of_birth: new Date(date_of_birth),
        mobile_number,
        email,
        password_hash: hashedPassword,
        profile_created_by,
        role_id: role.id
      }
    });
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { mobile_number, password } = req.body;
    const user = await prisma.user.findUnique({ where: { mobile_number } });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, role: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
