
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') }); // Point to server/.env (one level up from scripts)

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in server/.env');
    console.error('Current directory:', __dirname);
    process.exit(1);
}

const seedDemo = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find or Create Demo User
        let demoUser = await User.findOne({ email: 'demo@swapsafe.com' });

        if (!demoUser) {
            console.log('Creating new Demo User...');
            demoUser = await User.create({
                name: 'Demo User',
                email: 'demo@swapsafe.com',
                password: 'password123', // Will be hashed by pre-save
                isVerified: true,
                trustLevel: 'Trusted',
                credits: 50000
            });
        } else {
            console.log('Updating existing Demo User...');
            // Reset credits and trust
            demoUser.credits = 50000;
            demoUser.trustLevel = 'Trusted';
            demoUser.isVerified = true;
            await demoUser.save();
        }

        console.log(`✅ Demo User ready: ${demoUser.email} (ID: ${demoUser._id})`);

        // 2. Assign listings
        // We assign all listings that are NOT owned by "Demo User" to "Demo User" for testing
        // except maybe keeping some different if we want to test buying?
        // Actually, if I own ALL listings, I can't buy anything (cannot buy own listing).
        // So I should assign some valid listings to ANOTHER user ("Seller Bot") so Demo User can buy them.

        // Let's create a Seller Bot
        let sellerBot = await User.findOne({ email: 'seller@swapsafe.com' });
        if (!sellerBot) {
            sellerBot = await User.create({
                name: 'Pro Seller',
                email: 'seller@swapsafe.com',
                password: 'password123',
                isVerified: true,
                trustLevel: 'Legendary'
            });
        }

        // Split listings: 50% to Demo User (to see "My Listings"), 50% to Seller Bot (to buy)
        const allListings = await Listing.find({});
        console.log(`Found ${allListings.length} total listings.`);

        let myCount = 0;
        let otherCount = 0;

        for (let i = 0; i < allListings.length; i++) {
            const listing = allListings[i];
            // If index is even, give to Demo User. If odd, give to Seller Bot.
            if (i % 2 === 0) {
                listing.seller = demoUser._id;
                myCount++;
            } else {
                listing.seller = sellerBot._id;
                otherCount++;
            }
            await listing.save();
        }

        console.log(`✅ Assigned ${myCount} listings to Demo User (My Listings).`);
        console.log(`✅ Assigned ${otherCount} listings to Seller Bot (Available to Buy).`);

        console.log('🎉 Seed Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding:', error);
        process.exit(1);
    }
};

seedDemo();
