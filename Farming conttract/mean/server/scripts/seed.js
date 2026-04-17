require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { User } = require('../src/models/User');
const { FarmerProfile } = require('../src/models/FarmerProfile');
const { ProductListing } = require('../src/models/ProductListing');

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

const seedListings = [
  {
    farmerEmail: 'arun.farmer@acf.local',
    cropName: 'Paddy Rice',
    variety: 'IR64',
    quantity: 3200,
    unit: 'kg',
    pricePerUnit: 28,
    location: 'Tamil Nadu, Coimbatore',
    harvestDate: '2026-03-25',
    availableUntil: '2026-05-01',
    description: 'Cleaned and graded paddy stock, suitable for bulk buyers.',
    isActive: true,
  },
  {
    farmerEmail: 'arun.farmer@acf.local',
    cropName: 'Banana',
    variety: 'Robusta',
    quantity: 18,
    unit: 'tonne',
    pricePerUnit: 16200,
    location: 'Tamil Nadu, Pollachi',
    harvestDate: '2026-03-30',
    availableUntil: '2026-04-24',
    description: 'Freshly harvested lot with uniform sizing for wholesale dispatch.',
    isActive: true,
  },
  {
    farmerEmail: 'meena.farmer@acf.local',
    cropName: 'Turmeric',
    variety: 'Erode Local',
    quantity: 42,
    unit: 'quintal',
    pricePerUnit: 9150,
    location: 'Karnataka, Mysuru',
    harvestDate: '2026-03-22',
    availableUntil: '2026-04-28',
    description: 'Dry turmeric fingers, machine cleaned and bag packed.',
    isActive: true,
  },
  {
    farmerEmail: 'meena.farmer@acf.local',
    cropName: 'Maize',
    variety: 'Hybrid Yellow',
    quantity: 2600,
    unit: 'kg',
    pricePerUnit: 24,
    location: 'Karnataka, Mandya',
    harvestDate: '2026-03-28',
    availableUntil: '2026-04-26',
    description: 'Feed-grade maize with low moisture and ready loading support.',
    isActive: true,
  },
  {
    farmerEmail: 'meena.farmer@acf.local',
    cropName: 'Ragi',
    variety: 'Finger Millet',
    quantity: 140,
    unit: 'bag',
    pricePerUnit: 1280,
    location: 'Karnataka, Mysuru',
    harvestDate: '2026-02-18',
    availableUntil: '2026-03-20',
    description: 'Older listing retained for history and inactive listing coverage.',
    isActive: false,
  },
];

async function seed() {
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI in environment');
  }

  await mongoose.connect(mongoUri);

  const usersByEmail = new Map();

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

    usersByEmail.set(entry.email, user);

    if (entry.role === 'farmer' && entry.profile) {
      await FarmerProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: entry.profile },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  for (const listing of seedListings) {
    const farmer = usersByEmail.get(listing.farmerEmail);
    if (!farmer || farmer.role !== 'farmer') {
      throw new Error(`Seed listing references missing farmer account: ${listing.farmerEmail}`);
    }

    const filter = {
      farmerId: farmer._id,
      cropName: listing.cropName,
      variety: listing.variety,
      unit: listing.unit,
      location: listing.location,
    };

    await ProductListing.findOneAndUpdate(
      filter,
      {
        $set: {
          farmerId: farmer._id,
          cropName: listing.cropName,
          variety: listing.variety,
          quantity: listing.quantity,
          unit: listing.unit,
          pricePerUnit: listing.pricePerUnit,
          location: listing.location,
          harvestDate: new Date(listing.harvestDate),
          availableUntil: new Date(listing.availableUntil),
          description: listing.description,
          isActive: listing.isActive,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const userCount = await User.countDocuments();
  const farmerProfileCount = await FarmerProfile.countDocuments();
  const totalListingCount = await ProductListing.countDocuments();
  const activeListingCount = await ProductListing.countDocuments({ isActive: true });

  console.log(`Seed completed for database: ${mongoose.connection.name}`);
  console.log(`Users: ${userCount}`);
  console.log(`Farmer profiles: ${farmerProfileCount}`);
  console.log(`Marketplace listings: ${totalListingCount} total (${activeListingCount} active)`);
  console.log('Seeded accounts:');
  for (const entry of seedUsers) {
    console.log(`- ${entry.role}: ${entry.email} / ${entry.password}`);
  }
  console.log('Seeded marketplace listings:');
  for (const listing of seedListings) {
    console.log(`- ${listing.cropName} (${listing.quantity} ${listing.unit}) by ${listing.farmerEmail}`);
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
