import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MONGODB_URL = 'mongodb://localhost:27017/mogul-user';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  blockchainAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

async function createTestUser() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', userSchema);

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'testowner@example.com' });

    if (existingUser) {
      console.log('Test user already exists!');
      console.log(JSON.stringify({
        _id: existingUser._id.toString(),
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      }, null, 2));
      await mongoose.disconnect();
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    const testUser = new User({
      email: 'testowner@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Owner',
      blockchainAddress: '0x0000000000000000000000000000000000000001', // Placeholder
    });

    await testUser.save();

    console.log('✅ Test user created successfully!');
    console.log(JSON.stringify({
      _id: testUser._id.toString(),
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      blockchainAddress: testUser.blockchainAddress,
    }, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
