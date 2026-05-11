import mongoose from 'mongoose';

const MONGODB_URL = 'mongodb://localhost:27017/mogul-user';

async function updateTestUser() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'testowner@example.com' },
      { $set: { blockchainAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' } }
    );

    console.log('Updated user:', result.modifiedCount, 'document(s)');

    const user = await mongoose.connection.db.collection('users').findOne({ email: 'testowner@example.com' });
    console.log('User data:', JSON.stringify({
      _id: user._id.toString(),
      email: user.email,
      blockchainAddress: user.blockchainAddress
    }, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateTestUser();
