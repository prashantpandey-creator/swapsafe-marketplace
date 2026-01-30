/**
 * Database Seed Script - Production Quality
 * 
 * Creates initial users and sample listings for Buyers Legion
 * Run with: npm run seed
 * 
 * This script is idempotent - safe to run multiple times
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './models/User.js';
import Listing from './models/Listing.js';

// ============ SEED DATA ============

const USERS = [
    {
        name: 'Prashant Pandey',
        email: 'prashant@buyerslegion.com',
        password: 'Legion@123', // Will be hashed
        phone: '+91 98765 43210',
        location: { city: 'Delhi', state: 'Delhi' },
        isVerified: true,
        rating: 4.8,
        totalSales: 15,
        totalPurchases: 8,
        trustScore: 85,
        trustLevel: 'Trusted',
        avatar: 'https://ui-avatars.com/api/?name=Prashant+Pandey&background=fbbf24&color=0f172a&size=200'
    },
    {
        name: 'Nupur Sharma',
        email: 'nupur@buyerslegion.com',
        password: 'Legion@123',
        phone: '+91 98765 43211',
        location: { city: 'Mumbai', state: 'Maharashtra' },
        isVerified: true,
        rating: 4.9,
        totalSales: 22,
        totalPurchases: 12,
        trustScore: 92,
        trustLevel: 'Legendary',
        avatar: 'https://ui-avatars.com/api/?name=Nupur+Sharma&background=22c55e&color=fff&size=200'
    }
];

// Prashant's Listings
const PRASHANT_LISTINGS = [
    {
        title: 'iPhone 14 Pro Max 256GB - Deep Purple',
        description: 'Excellent condition iPhone 14 Pro Max. Used for 10 months, always with case and screen protector. Battery health 94%. Includes original box, charger, and AppleCare+ valid until March 2025. No scratches or dents. Reason for selling: Upgrading to iPhone 15 Pro.',
        category: 'electronics',
        condition: 'like-new',
        price: 89999,
        originalPrice: 139900,
        images: [
            'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800',
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800'
        ],
        location: { city: 'Delhi', state: 'Delhi' },
        deliveryOptions: { meetup: true, shipping: true }
    },
    {
        title: 'Sony PlayStation 5 Disc Edition + 3 Games',
        description: 'PS5 Disc Edition in perfect working condition. Comes with 2 DualSense controllers, Spider-Man 2, God of War Ragnarok, and FIFA 24. All accessories included. Selling because I dont have time to game anymore.',
        category: 'electronics',
        condition: 'good',
        price: 42000,
        originalPrice: 54990,
        images: [
            'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800',
            'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800'
        ],
        location: { city: 'Delhi', state: 'Delhi' },
        deliveryOptions: { meetup: true, shipping: true }
    },
    {
        title: 'Royal Enfield Classic 350 - 2022 Model',
        description: 'Single owner Royal Enfield Classic 350 Signals Edition. Only 8,500 km driven. Regular servicing at authorized center. All documents clear, insurance valid till Dec 2025. Includes crash guards, leg guards, and premium seat cover.',
        category: 'vehicles',
        condition: 'like-new',
        price: 165000,
        originalPrice: 210000,
        images: [
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
            'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800'
        ],
        location: { city: 'Delhi', state: 'Delhi' },
        deliveryOptions: { meetup: true, shipping: false }
    }
];

// Nupur's Listings
const NUPUR_LISTINGS = [
    {
        title: 'MacBook Pro 14" M2 Pro - Space Gray',
        description: 'MacBook Pro 14-inch with M2 Pro chip, 16GB RAM, 512GB SSD. Purchased in August 2023. AppleCare+ active. Battery cycle count: 87. Flawless condition, always used on desk with external monitor. Includes MagSafe charger and original box.',
        category: 'electronics',
        condition: 'like-new',
        price: 175000,
        originalPrice: 224900,
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'
        ],
        location: { city: 'Mumbai', state: 'Maharashtra' },
        deliveryOptions: { meetup: true, shipping: true }
    },
    {
        title: 'Designer Saree Collection - Set of 5',
        description: 'Exquisite collection of 5 premium silk sarees. Includes 2 Banarasi, 2 Kanchipuram, and 1 Patola. All handwoven with zari work. Worn only once each for special occasions. Perfect for weddings and festivals. Combined retail value over ₹85,000.',
        category: 'fashion',
        condition: 'like-new',
        price: 45000,
        originalPrice: 85000,
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
            'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800'
        ],
        location: { city: 'Mumbai', state: 'Maharashtra' },
        deliveryOptions: { meetup: true, shipping: true }
    },
    {
        title: 'IKEA L-Shape Sofa - Premium Fabric',
        description: 'IKEA FRIHETEN L-shape sofa bed in dark grey. Dual function: comfortable sofa + pull-out double bed. Built-in storage under chaise. 2 years old, excellent condition, no stains or tears. We are relocating internationally hence selling.',
        category: 'home',
        condition: 'good',
        price: 28000,
        originalPrice: 54990,
        images: [
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
            'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800'
        ],
        location: { city: 'Mumbai', state: 'Maharashtra' },
        deliveryOptions: { meetup: true, shipping: false }
    }
];

// ============ SEED FUNCTIONS ============

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
}

async function clearExistingData() {
    console.log('🧹 Clearing existing seed data...');

    // Only delete seed users (by email pattern)
    const seedEmails = USERS.map(u => u.email);
    const deletedUsers = await User.deleteMany({ email: { $in: seedEmails } });
    console.log(`   Deleted ${deletedUsers.deletedCount} seed users`);

    // Delete listings from seed users
    const users = await User.find({ email: { $in: seedEmails } });
    if (users.length > 0) {
        const userIds = users.map(u => u._id);
        const deletedListings = await Listing.deleteMany({ seller: { $in: userIds } });
        console.log(`   Deleted ${deletedListings.deletedCount} listings`);
    }
}

async function createUsers() {
    console.log('👥 Creating users...');
    const createdUsers = [];

    for (const userData of USERS) {
        // Check if user already exists
        let user = await User.findOne({ email: userData.email });

        if (user) {
            console.log(`   ⏭️  User ${userData.name} already exists`);
            createdUsers.push(user);
            continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        user = new User({
            ...userData,
            password: hashedPassword
        });

        await user.save();
        console.log(`   ✅ Created user: ${userData.name} (${userData.email})`);
        createdUsers.push(user);
    }

    return createdUsers;
}

async function createListings(users) {
    console.log('📦 Creating listings...');

    const [prashant, nupur] = users;
    let totalCreated = 0;

    // Prashant's listings
    for (const listingData of PRASHANT_LISTINGS) {
        const existing = await Listing.findOne({
            seller: prashant._id,
            title: listingData.title
        });

        if (existing) {
            console.log(`   ⏭️  Listing "${listingData.title}" already exists`);
            continue;
        }

        const listing = new Listing({
            ...listingData,
            seller: prashant._id,
            status: 'active',
            views: Math.floor(Math.random() * 500) + 50
        });

        await listing.save();
        console.log(`   ✅ Created: ${listingData.title}`);
        totalCreated++;
    }

    // Nupur's listings
    for (const listingData of NUPUR_LISTINGS) {
        const existing = await Listing.findOne({
            seller: nupur._id,
            title: listingData.title
        });

        if (existing) {
            console.log(`   ⏭️  Listing "${listingData.title}" already exists`);
            continue;
        }

        const listing = new Listing({
            ...listingData,
            seller: nupur._id,
            status: 'active',
            views: Math.floor(Math.random() * 500) + 50
        });

        await listing.save();
        console.log(`   ✅ Created: ${listingData.title}`);
        totalCreated++;
    }

    return totalCreated;
}

// ============ MAIN ============

async function seed() {
    console.log('\n🌱 BUYERS LEGION - Database Seed\n');
    console.log('================================\n');

    await connectDB();

    // Create users
    const users = await createUsers();

    // Create listings
    const listingsCount = await createListings(users);

    // Summary
    console.log('\n================================');
    console.log('✨ Seed completed successfully!\n');
    console.log(`   Users: ${users.length}`);
    console.log(`   Listings: ${listingsCount}`);
    console.log('\n📧 Test Login Credentials:');
    console.log('   Email: prashant@buyerslegion.com');
    console.log('   Password: Legion@123');
    console.log('\n   Email: nupur@buyerslegion.com');
    console.log('   Password: Legion@123');
    console.log('================================\n');

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
}

// Run seed
seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
