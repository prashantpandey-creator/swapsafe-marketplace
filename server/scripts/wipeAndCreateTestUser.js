/**
 * One-off: wipe all demo/seed data and create a single clean test account.
 *
 * Removes every listing and every user EXCEPT a freshly created test user,
 * so the marketplace starts genuinely empty — only real sign-ups + uploads
 * will populate it afterwards.
 *
 * Usage (on the server, where MONGODB_URI is set):
 *   node server/scripts/wipeAndCreateTestUser.js
 */
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

const TEST_EMAIL = 'test@swapsafe.store';
const TEST_PASSWORD = 'TestSwap@2026';
const TEST_NAME = 'Test Seller';

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not set');
        process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // 1. Wipe ALL listings (all were demo data)
    const delListings = await Listing.deleteMany({});
    console.log(`Deleted ${delListings.deletedCount} listings`);

    // 2. Wipe ALL users (demo + temp guests). Clean slate.
    const delUsers = await User.deleteMany({});
    console.log(`Deleted ${delUsers.deletedCount} users`);

    // 3. Create one real test account.
    // Pass the PLAIN password — the User model's pre('save') hook hashes it.
    const testUser = await User.create({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        isVerified: true,
        accountStatus: 'active',
    });
    console.log('\n=== TEST ACCOUNT CREATED ===');
    console.log('Email:    ', TEST_EMAIL);
    console.log('Password: ', TEST_PASSWORD);
    console.log('UserID:   ', testUser._id.toString());
    console.log('============================\n');

    await mongoose.disconnect();
    console.log('Done. Marketplace is now empty except the test account.');
}

run().catch((e) => {
    console.error('FAILED:', e);
    process.exit(1);
});
