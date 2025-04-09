const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

// Load the User model
const User = require('./src/models/user');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function createSuperAdmin() {
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('A SuperAdmin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Set default credentials - you should change these
    const email = 'superadmin@example.com';
    const password = 'superadmin123';
    const name = 'Super Admin';

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the superadmin user
    const superAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
      permissions: ['all']
    });

    await superAdmin.save();
    console.log('SuperAdmin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('IMPORTANT: Change these credentials in production!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
    process.exit(1);
  }
}

createSuperAdmin(); 