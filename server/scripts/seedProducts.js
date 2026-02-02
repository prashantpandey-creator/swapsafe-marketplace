/**
 * Sample Product Data Seeder
 * 
 * Seeds the ProductDatabase with popular products for Digital Twin matching.
 * Run with: node scripts/seedProducts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductDatabase from '../models/ProductDatabase.js';

dotenv.config();

const sampleProducts = [
    // ============================================
    // PHONES
    // ============================================
    {
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        category: 'electronics',
        subcategory: 'phones',
        variants: [
            { name: '128GB Natural Titanium', color: 'Natural Titanium', storage: '128GB' },
            { name: '256GB Natural Titanium', color: 'Natural Titanium', storage: '256GB' },
            { name: '256GB Blue Titanium', color: 'Blue Titanium', storage: '256GB' },
            { name: '256GB White Titanium', color: 'White Titanium', storage: '256GB' },
            { name: '256GB Black Titanium', color: 'Black Titanium', storage: '256GB' },
            { name: '512GB Black Titanium', color: 'Black Titanium', storage: '512GB' },
            { name: '1TB Black Titanium', color: 'Black Titanium', storage: '1TB' }
        ],
        uniqueIdConfig: {
            type: 'imei',
            format: '^\\d{15}$',
            length: 15,
            instructions: 'Dial *#06# on your phone to see the IMEI',
            example: '359802110054291'
        },
        specifications: {
            releaseYear: 2023,
            msrp: 134900,
            dimensions: { height: 146.6, width: 70.6, depth: 8.25, unit: 'mm' },
            weight: { value: 187, unit: 'g' }
        },
        keywords: ['iphone 15 pro', 'iphone15pro', 'apple iphone', 'ip15pro']
    },
    {
        brand: 'Apple',
        model: 'iPhone 15',
        category: 'electronics',
        subcategory: 'phones',
        variants: [
            { name: '128GB Pink', color: 'Pink', storage: '128GB' },
            { name: '128GB Blue', color: 'Blue', storage: '128GB' },
            { name: '128GB Green', color: 'Green', storage: '128GB' },
            { name: '256GB Black', color: 'Black', storage: '256GB' }
        ],
        uniqueIdConfig: {
            type: 'imei',
            format: '^\\d{15}$',
            length: 15,
            instructions: 'Dial *#06# on your phone',
            example: '359802110054291'
        },
        specifications: {
            releaseYear: 2023,
            msrp: 79900,
            dimensions: { height: 147.6, width: 71.6, depth: 7.80, unit: 'mm' },
            weight: { value: 171, unit: 'g' }
        },
        keywords: ['iphone 15', 'iphone15', 'apple iphone 15']
    },
    {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        category: 'electronics',
        subcategory: 'phones',
        variants: [
            { name: '256GB Titanium Black', color: 'Titanium Black', storage: '256GB' },
            { name: '256GB Titanium Gray', color: 'Titanium Gray', storage: '256GB' },
            { name: '512GB Titanium Violet', color: 'Titanium Violet', storage: '512GB' },
            { name: '1TB Titanium Yellow', color: 'Titanium Yellow', storage: '1TB' }
        ],
        uniqueIdConfig: {
            type: 'imei',
            format: '^\\d{15}$',
            length: 15,
            instructions: 'Dial *#06# or check Settings > About Phone > IMEI',
            example: '354678901234567'
        },
        specifications: {
            releaseYear: 2024,
            msrp: 129999,
            dimensions: { height: 162.3, width: 79.0, depth: 8.6, unit: 'mm' },
            weight: { value: 232, unit: 'g' }
        },
        keywords: ['galaxy s24 ultra', 's24 ultra', 'samsung s24', 'galaxy ultra']
    },
    {
        brand: 'OnePlus',
        model: 'OnePlus 12',
        category: 'electronics',
        subcategory: 'phones',
        variants: [
            { name: '256GB Flowy Emerald', color: 'Flowy Emerald', storage: '256GB' },
            { name: '256GB Silky Black', color: 'Silky Black', storage: '256GB' },
            { name: '512GB Silky Black', color: 'Silky Black', storage: '512GB' }
        ],
        uniqueIdConfig: {
            type: 'imei',
            format: '^\\d{15}$',
            length: 15,
            instructions: 'Dial *#06# or Settings > About Device > Status',
            example: '867530098765432'
        },
        specifications: {
            releaseYear: 2024,
            msrp: 64999,
            dimensions: { height: 164.3, width: 75.8, depth: 9.15, unit: 'mm' },
            weight: { value: 220, unit: 'g' }
        },
        keywords: ['oneplus 12', 'oneplus12', '1+12', 'one plus 12']
    },

    // ============================================
    // LAPTOPS
    // ============================================
    {
        brand: 'Apple',
        model: 'MacBook Pro 14"',
        category: 'electronics',
        subcategory: 'laptops',
        variants: [
            { name: 'M3 Pro 18GB Space Black', color: 'Space Black', storage: '512GB' },
            { name: 'M3 Pro 18GB Silver', color: 'Silver', storage: '512GB' },
            { name: 'M3 Max 36GB Space Black', color: 'Space Black', storage: '1TB' }
        ],
        uniqueIdConfig: {
            type: 'serial',
            format: '^[A-Z0-9]{10,12}$',
            length: 12,
            instructions: 'Apple Menu > About This Mac > Serial Number',
            example: 'C02ZX1Y2JHCD'
        },
        specifications: {
            releaseYear: 2023,
            msrp: 199900,
            dimensions: { height: 15.5, width: 312.6, depth: 221.2, unit: 'mm' },
            weight: { value: 1610, unit: 'g' }
        },
        keywords: ['macbook pro 14', 'mbp 14', 'macbook m3', 'apple laptop']
    },
    {
        brand: 'Dell',
        model: 'XPS 15',
        category: 'electronics',
        subcategory: 'laptops',
        variants: [
            { name: 'i7 16GB 512GB Silver', color: 'Platinum Silver', storage: '512GB' },
            { name: 'i7 32GB 1TB Silver', color: 'Platinum Silver', storage: '1TB' }
        ],
        uniqueIdConfig: {
            type: 'serial',
            format: '^[A-Z0-9]{7}$',
            length: 7,
            instructions: 'Check the bottom of laptop or type "wmic bios get serialnumber" in CMD',
            example: 'ABC1234'
        },
        specifications: {
            releaseYear: 2023,
            msrp: 159990,
            weight: { value: 1860, unit: 'g' }
        },
        keywords: ['dell xps 15', 'xps15', 'dell xps', 'dell laptop']
    },

    // ============================================
    // VEHICLES (Bikes & Cars)
    // ============================================
    {
        brand: 'Royal Enfield',
        model: 'Classic 350',
        category: 'vehicles',
        subcategory: 'motorcycles',
        variants: [
            { name: 'Halcyon Black', color: 'Halcyon Black' },
            { name: 'Signals Marsh Grey', color: 'Signals Marsh Grey' },
            { name: 'Chrome Red', color: 'Chrome Red' }
        ],
        uniqueIdConfig: {
            type: 'vin',
            format: '^[A-HJ-NPR-Z0-9]{17}$',
            length: 17,
            instructions: 'Check the engine number plate or RC book',
            example: 'MBLHA14EH9HA12345'
        },
        specifications: {
            releaseYear: 2024,
            msrp: 193000
        },
        keywords: ['royal enfield classic', 'classic 350', 're classic', 'bullet 350']
    },
    {
        brand: 'Hero',
        model: 'Splendor Plus',
        category: 'vehicles',
        subcategory: 'motorcycles',
        variants: [
            { name: 'Black Silver', color: 'Black Silver' },
            { name: 'Heavy Grey', color: 'Heavy Grey' }
        ],
        uniqueIdConfig: {
            type: 'vin',
            format: '^[A-HJ-NPR-Z0-9]{17}$',
            length: 17,
            instructions: 'Check engine number on RC book',
            example: 'MBLJC31AMHGA12345'
        },
        specifications: {
            releaseYear: 2024,
            msrp: 76000
        },
        keywords: ['hero splendor', 'splendor plus', 'hero bike', 'splendor xtec']
    },

    // ============================================
    // SNEAKERS
    // ============================================
    {
        brand: 'Nike',
        model: 'Air Jordan 1 Retro High OG',
        category: 'fashion',
        subcategory: 'sneakers',
        variants: [
            { name: 'Chicago', color: 'White/Varsity Red/Black', size: 'Multiple' },
            { name: 'Bred', color: 'Black/Varsity Red/White', size: 'Multiple' },
            { name: 'Royal', color: 'Black/Royal Blue/White', size: 'Multiple' }
        ],
        uniqueIdConfig: {
            type: 'sku',
            format: '^[A-Z0-9]{6}-[0-9]{3}$',
            length: 10,
            instructions: 'Check the label inside the shoe or on the box',
            example: 'DZ5485-612'
        },
        specifications: {
            releaseYear: 2023,
            msrp: 16995
        },
        keywords: ['jordan 1', 'aj1', 'air jordan', 'jordan retro', 'jordan high']
    },
    {
        brand: 'Adidas',
        model: 'Yeezy Boost 350 V2',
        category: 'fashion',
        subcategory: 'sneakers',
        variants: [
            { name: 'Onyx', color: 'Onyx', size: 'Multiple' },
            { name: 'Bone', color: 'Bone', size: 'Multiple' },
            { name: 'Zebra', color: 'White/Core Black/Red', size: 'Multiple' }
        ],
        uniqueIdConfig: {
            type: 'sku',
            format: '^[A-Z]{2}[0-9]{4}$',
            length: 6,
            instructions: 'Check the label inside the shoe',
            example: 'HQ4540'
        },
        specifications: {
            releaseYear: 2023,
            msrp: 22999
        },
        keywords: ['yeezy 350', 'yeezy boost', 'adidas yeezy', '350 v2']
    },

    // ============================================
    // WATCHES
    // ============================================
    {
        brand: 'Apple',
        model: 'Apple Watch Ultra 2',
        category: 'electronics',
        subcategory: 'watches',
        variants: [
            { name: '49mm Titanium Blue Alpine Loop', color: 'Titanium', storage: '64GB' },
            { name: '49mm Titanium Orange Ocean Band', color: 'Titanium', storage: '64GB' }
        ],
        uniqueIdConfig: {
            type: 'serial',
            format: '^[A-Z0-9]{10,12}$',
            length: 12,
            instructions: 'Settings > General > About > Serial Number',
            example: 'FH7XK2Y3HF7D'
        },
        specifications: {
            releaseYear: 2023,
            msrp: 89900,
            weight: { value: 61.4, unit: 'g' }
        },
        keywords: ['apple watch ultra', 'watch ultra 2', 'apple ultra', 'aw ultra']
    },

    // ============================================
    // GAMING
    // ============================================
    {
        brand: 'Sony',
        model: 'PlayStation 5',
        category: 'electronics',
        subcategory: 'gaming',
        variants: [
            { name: 'Standard Edition', storage: '825GB' },
            { name: 'Digital Edition', storage: '825GB' }
        ],
        uniqueIdConfig: {
            type: 'serial',
            format: '^[A-Z0-9]{11,17}$',
            length: 17,
            instructions: 'Check the barcode sticker on the back of the console',
            example: 'CFI-1102A-01-123456'
        },
        specifications: {
            releaseYear: 2020,
            msrp: 49990,
            weight: { value: 4500, unit: 'g' }
        },
        keywords: ['ps5', 'playstation 5', 'sony playstation', 'playstation5']
    },
    {
        brand: 'Microsoft',
        model: 'Xbox Series X',
        category: 'electronics',
        subcategory: 'gaming',
        variants: [
            { name: 'Standard', storage: '1TB' }
        ],
        uniqueIdConfig: {
            type: 'serial',
            format: '^[0-9]{12}$',
            length: 12,
            instructions: 'Check the back of the console near the ports',
            example: '123456789012'
        },
        specifications: {
            releaseYear: 2020,
            msrp: 49990,
            weight: { value: 4450, unit: 'g' }
        },
        keywords: ['xbox series x', 'xsx', 'xbox', 'microsoft xbox']
    },

    // ============================================
    // AUDIO
    // ============================================
    {
        brand: 'Apple',
        model: 'AirPods Pro 2nd Gen',
        category: 'electronics',
        subcategory: 'audio',
        variants: [
            { name: 'with MagSafe Case (USB-C)', color: 'White' }
        ],
        uniqueIdConfig: {
            type: 'serial',
            format: '^[A-Z0-9]{10,12}$',
            length: 12,
            instructions: 'Settings > Bluetooth > AirPods > (i) > Serial Number',
            example: 'H9QPKM3Y2XF'
        },
        specifications: {
            releaseYear: 2023,
            msrp: 24900,
            weight: { value: 50.8, unit: 'g' }
        },
        keywords: ['airpods pro', 'airpods pro 2', 'app2', 'apple airpods']
    },
    {
        brand: 'Sony',
        model: 'WH-1000XM5',
        category: 'electronics',
        subcategory: 'audio',
        variants: [
            { name: 'Black', color: 'Black' },
            { name: 'Silver', color: 'Platinum Silver' },
            { name: 'Midnight Blue', color: 'Midnight Blue' }
        ],
        uniqueIdConfig: {
            type: 'serial',
            format: '^[A-Z0-9]{7,10}$',
            length: 10,
            instructions: 'Check inside the left ear cup',
            example: '1234567890'
        },
        specifications: {
            releaseYear: 2022,
            msrp: 29990,
            weight: { value: 250, unit: 'g' }
        },
        keywords: ['sony xm5', 'wh-1000xm5', 'sony headphones', 'xm5']
    },
    {
        brand: 'JBL',
        model: 'Flip 6',
        category: 'electronics',
        subcategory: 'audio',
        variants: [
            { name: 'Black', color: 'Black' },
            { name: 'Blue', color: 'Blue' },
            { name: 'Red', color: 'Red' },
            { name: 'Teal', color: 'Teal' }
        ],
        uniqueIdConfig: {
            type: 'serial',
            format: '^[A-Z0-9]{10,14}$',
            length: 14,
            instructions: 'Check the label on the bottom of the speaker',
            example: 'BE1234567890AB'
        },
        specifications: {
            releaseYear: 2022,
            msrp: 12999,
            weight: { value: 550, unit: 'g' }
        },
        keywords: ['jbl flip 6', 'flip6', 'jbl speaker', 'jbl bluetooth']
    }
];

async function seedProducts() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swapsafe';
        await mongoose.connect(mongoUri);
        console.log('📦 Connected to MongoDB');

        // Clear existing products (optional - comment out to append)
        // await ProductDatabase.deleteMany({});
        // console.log('🗑️ Cleared existing products');

        // Insert sample products
        for (const product of sampleProducts) {
            try {
                await ProductDatabase.findOneAndUpdate(
                    { brand: product.brand, model: product.model },
                    product,
                    { upsert: true, new: true }
                );
                console.log(`✅ ${product.brand} ${product.model}`);
            } catch (err) {
                console.log(`⚠️ ${product.brand} ${product.model}: ${err.message}`);
            }
        }

        console.log(`\n🎉 Seeded ${sampleProducts.length} products to ProductDatabase`);

        // Show category breakdown
        const categories = await ProductDatabase.aggregate([
            { $group: { _id: { category: '$category', subcategory: '$subcategory' }, count: { $sum: 1 } } },
            { $sort: { '_id.category': 1 } }
        ]);

        console.log('\n📊 Products by category:');
        categories.forEach(c => {
            console.log(`   ${c._id.category}/${c._id.subcategory}: ${c.count}`);
        });

    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

seedProducts();
