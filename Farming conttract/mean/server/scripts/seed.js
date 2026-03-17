require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { User } = require('../src/models/User');
const { FarmerProfile } = require('../src/models/FarmerProfile');

const mongoUri = process.env.MONGO_URI;

const seedUsers = [
  {
    name: 'Arun Kumar',
    email: 'arun.farmer@acf.local',
    password: 'Farmer@123',
    role: 'farmer',
    profile: {
      region: 'Tamil Nadu, Coimbatore',
      crops: ['Rice', 'Sugarcane', 'Banana'],
      bio: 'Progressive farmer focused on seasonal planning and reliable supply.',
      upiId: 'arunfarms@upi',
      bank: {
        accountHolderName: 'Arun Kumar',
        accountNumber: '541200010045678',
        ifsc: 'SBIN0000456',
        bankName: 'State Bank of India',
      },
    },
  },
  {
    name: 'Meena Lakshmi',
    email: 'meena.farmer@acf.local',
    password: 'Farmer@123',
    role: 'farmer',
    profile: {
      region: 'Karnataka, Mysuru',
      crops: ['Ragi', 'Maize', 'Turmeric'],
      bio: 'Cultivates mixed crops with emphasis on quality and consistent delivery.',
      upiId: 'meenafarm@oksbi',
      bank: {
        accountHolderName: 'Meena Lakshmi',
        accountNumber: '003456781245',
        ifsc: 'HDFC0001023',
        bankName: 'HDFC Bank',
      },
    },
  },
  {
    name: 'Ravi Agro Traders',
    email: 'ravi.buyer@acf.local',
    password: 'Buyer@123',
    role: 'buyer',
    desiredCrops: ['Rice', 'Turmeric', 'Maize'],
    savedCard: {
      cardHolderName: 'Ravi Agro Traders',
      cardBrand: 'Visa',
      last4: '4242',
      expiryMonth: '09',
      expiryYear: '2028',
    },
  },
  {
    name: 'Green Harvest Foods',
    email: 'greenharvest.buyer@acf.local',
    password: 'Buyer@123',
    role: 'buyer',
    desiredCrops: ['Banana', 'Sugarcane', 'Ragi'],
    savedCard: {
      cardHolderName: 'Green Harvest Foods',
      cardBrand: 'Mastercard',
      last4: '5100',
      expiryMonth: '11',
      expiryYear: '2029',
    },
  },
];

async function seed() {
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI in environment');
  }

  await mongoose.connect(mongoUri);

  for (const entry of seedUsers) {
    const passwordHash = await bcrypt.hash(entry.password, 12);

    const user = await User.findOneAndUpdate(
      { email: entry.email },
      {
        $set: {
          name: entry.name,
          email: entry.email,
          passwordHash,
          role: entry.role,
          desiredCrops: entry.role === 'buyer' ? entry.desiredCrops || [] : [],
          savedCard: entry.role === 'buyer' ? entry.savedCard || undefined : undefined,
          resetPasswordTokenHash: undefined,
          resetPasswordExpiresAt: undefined,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (entry.role === 'farmer' && entry.profile) {
      await FarmerProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: entry.profile },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  const userCount = await User.countDocuments();
  const farmerProfileCount = await FarmerProfile.countDocuments();

  console.log(`Seed completed for database: ${mongoose.connection.name}`);
  console.log(`Users: ${userCount}`);
  console.log(`Farmer profiles: ${farmerProfileCount}`);
  console.log('Seeded accounts:');
  for (const entry of seedUsers) {
    console.log(`- ${entry.role}: ${entry.email} / ${entry.password}`);
  }
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
