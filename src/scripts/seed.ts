import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { Coupon } from '../models/Coupon.js';
import { Article } from '../models/Article.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/axminprana_ayurveda';

async function seed() {
  console.log('[Seed] Connecting to MongoDB at', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
    Coupon.deleteMany({}),
    Article.deleteMany({})
  ]);

  console.log('[Seed] Creating Users...');

  const adminUser = await User.create({
    name: 'Vaidya Ananth Sharma (Admin)',
    email: 'admin@axminprana.com',
    password: 'Admin@12345',
    phone: '9876543210',
    role: 'admin',
    addresses: [
      {
        fullName: 'Vaidya Ananth Sharma',
        phone: '9876543210',
        addressLine1: 'Plot 42, Vedic Heritage Enclave',
        addressLine2: 'Civil Lines',
        city: 'Dehradun',
        state: 'Uttarakhand',
        pincode: '248001',
        isDefault: true
      }
    ]
  });

  const customerUser = await User.create({
    name: 'Aarav Patel',
    email: 'customer@axminprana.com',
    password: 'Customer@12345',
    phone: '9811223344',
    role: 'customer',
    addresses: [
      {
        fullName: 'Aarav Patel',
        phone: '9811223344',
        addressLine1: 'Flat 402, Nilgiri Greens',
        addressLine2: 'Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        isDefault: true
      }
    ]
  });

  console.log('[Seed] Creating Categories...');
  const categories = await Category.create([
    {
      name: 'Immunity & Rasayana',
      slug: 'immunity-rasayana',
      description: 'Rejuvenative tonics and formulations to fortify Ojas (vital vigor) and respiratory vitality.',
      icon: 'ShieldCheck',
      image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
      doshaAffinity: 'All Doshas (Tridoshic)',
      productCount: 4,
      order: 1
    },
    {
      name: 'Stress & Cognitive Health',
      slug: 'stress-sleep',
      description: 'Medhya Rasayanas engineered to pacify Prana Vata, relieve cognitive fatigue, and restore deep restorative sleep.',
      icon: 'Moon',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      doshaAffinity: 'Vata & Pitta',
      productCount: 3,
      order: 2
    },
    {
      name: 'Digestive & Gut Health',
      slug: 'digestive-gut',
      description: 'Classic carminatives and churnas to kindle Jatharagni (digestive fire) and eliminate Ama (metabolic toxins).',
      icon: 'Flame',
      image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
      doshaAffinity: 'Vata & Kapha',
      productCount: 3,
      order: 3
    },
    {
      name: 'Skin Radiance & Kanti',
      slug: 'skin-radiance',
      description: 'Saffron-infused herbal oils and botanical leparchitectures for luminous, nourished, blemish-free skin.',
      icon: 'Sparkles',
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
      doshaAffinity: 'Pitta & Vata',
      productCount: 3,
      order: 4
    },
    {
      name: 'Hair Therapy & Keshya',
      slug: 'hair-therapy',
      description: 'Authentic Tailams cold-pressed with Bringaraj and Amla for follicle strengthening and scalp cooling.',
      icon: 'Flower2',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      doshaAffinity: 'Pitta Pacifying',
      productCount: 3,
      order: 5
    },
    {
      name: 'Joint Care & Sandhi',
      slug: 'joint-muscle-care',
      description: 'Warm herbal oils and guggulu tablets to alleviate stiffness, lubricate joints, and soothe Vata distress.',
      icon: 'Activity',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      doshaAffinity: 'Vata Pacifying',
      productCount: 2,
      order: 6
    }
  ]);

  console.log('[Seed] Creating Products...');
  const products = await Product.create([
    {
      name: 'Ashwagandha Supreme KSM-66® Organic',
      slug: 'ashwagandha-supreme-ksm66',
      tagline: 'Standardized Full-Spectrum Root Extract for Adrenal Harmony & Deep Vitality',
      description: 'Handcrafted from certified organic roots of Withania somnifera harvested at peak maturity in central India. Ashwagandha is revered in the Charaka Samhita as the premier Rasayana to build Ojas, stabilize cortisol rhythms, and bestow the endurance of a noble steed. Standardized to 5% withanolides through ancient water-extraction methods without synthetic solvents.',
      category: 'Stress & Cognitive Health',
      subCategory: 'Medhya Rasayana',
      brand: 'Axmin Prana Heritage',
      price: 999,
      salePrice: 849,
      sku: 'AP-ASH-001',
      stock: 45,
      packSize: '60 Veggie Capsules',
      variants: [
        { sku: 'AP-ASH-001-60', packSize: '60 Veggie Capsules', price: 999, salePrice: 849, stock: 45 },
        { sku: 'AP-ASH-001-120', packSize: '120 Veggie Capsules', price: 1799, salePrice: 1549, stock: 28 }
      ],
      format: 'Capsule',
      images: [
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      reviewCount: 142,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Ashwagandha Root Extract', botanicalName: 'Withania somnifera', portion: '500 mg', benefit: 'Relieves stress and stabilizes cortisol' },
        { name: 'Organic Black Pepper Extract (BioPerine®)', botanicalName: 'Piper nigrum', portion: '5 mg', benefit: 'Enhances herbal bioavailability and absorption' }
      ],
      dosageInstructions: 'Take 1 to 2 capsules daily, preferably 30 minutes after your evening meal.',
      anupana: 'Warm organic cow’s milk, almond milk, or lukewarm water with a dash of raw honey.',
      storageInstructions: 'Store in an airtight glass container away from direct sunlight, moisture, and high heat.',
      warnings: 'Consult an Ayurvedic physician if pregnant or undergoing thyroid medication.',
      doshaBalancing: { vata: true, pitta: false, kapha: true, primaryDosha: 'Vata' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8841',
      batchNumber: 'AP-2026-ASH01',
      expiryMonths: 36,
      taxPercent: 12
    },
    {
      name: 'Kumkumadi Miraculous Radiant Beauty Tailam',
      slug: 'kumkumadi-radiant-tailam',
      tagline: '100% Pure Saffron, Red Sandalwood & 24 Ayurvedic Botanicals Facial Oil',
      description: 'Prescribed in the Ashtanga Hridaya as the royal elixir for flawless complexion. Each batch undergoes a rigorous 72-hour slow boiling ritual in pure Kashmiri saffron, wild goat milk, red sandalwood, and padmaka. Penetrates micro-cellular layers to dissolve blemishes, lighten pigmentation, and infuse skin with an incandescent glow.',
      category: 'Skin Radiance & Kanti',
      subCategory: 'Kanti Vardhaka',
      brand: 'Axmin Prana Heritage',
      price: 1850,
      salePrice: 1599,
      sku: 'AP-KUM-002',
      stock: 22,
      packSize: '30 ml Royal Dropper Flacon',
      variants: [
        { sku: 'AP-KUM-002-30', packSize: '30 ml Royal Dropper Flacon', price: 1850, salePrice: 1599, stock: 22 },
        { sku: 'AP-KUM-002-50', packSize: '50 ml Royal Dropper Flacon', price: 2850, salePrice: 2499, stock: 15 }
      ],
      format: 'Oil',
      images: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      rating: 4.95,
      reviewCount: 98,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Kashmiri Mogra Kesar (Saffron)', botanicalName: 'Crocus sativus', portion: '12%', benefit: 'Illuminates skin and evens discoloration' },
        { name: 'Rakta Chandana (Red Sandalwood)', botanicalName: 'Pterocarpus santalinus', portion: '8%', benefit: 'Cools inflammation and purifies tone' },
        { name: 'Manjistha (Indian Madder)', botanicalName: 'Rubia cordifolia', portion: '10%', benefit: 'Lymphatic skin detoxifier and radiance booster' }
      ],
      dosageInstructions: 'Warm 3 to 4 drops between clean palms and press gently across freshly cleansed damp face and neck before sleeping.',
      anupana: 'Pure Rose Water Mist (Gulab Jal) applied prior to oil application.',
      storageInstructions: 'Store in cool ambient temperature away from direct UV light.',
      warnings: 'For topical external use only. Patch test on jawline for sensitive skin.',
      doshaBalancing: { vata: true, pitta: true, kapha: false, primaryDosha: 'Pitta' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8842',
      batchNumber: 'AP-2026-KUM04',
      expiryMonths: 24,
      taxPercent: 12
    },
    {
      name: 'Triphala Bio-Active Gut Cleanse & Detox Churna',
      slug: 'triphala-bio-active-churna',
      tagline: 'Equal-Ratio Blend of Amalaki, Bibhitaki & Haritaki for Colon Harmony',
      description: 'The golden triad of Ayurveda. Micro-pulverized using stone mills below 40°C to safeguard heat-sensitive bio-flavonoids and natural Vitamin C. Triphala harmonizes all three doshas, gently cleanses accumulated Ama from the digestive tract without habit-forming laxatives, and restores healthy microbiome diversity.',
      category: 'Digestive & Gut Health',
      subCategory: 'Deepana & Pachana',
      brand: 'Axmin Prana Heritage',
      price: 549,
      salePrice: 449,
      sku: 'AP-TRI-003',
      stock: 65,
      packSize: '200g Pure Herbal Powder',
      variants: [
        { sku: 'AP-TRI-003-200', packSize: '200g Pure Herbal Powder', price: 549, salePrice: 449, stock: 65 },
        { sku: 'AP-TRI-003-500', packSize: '500g Value Pouch', price: 999, salePrice: 849, stock: 40 }
      ],
      format: 'Churna',
      images: [
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
      rating: 4.85,
      reviewCount: 215,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Organic Haritaki', botanicalName: 'Terminalia chebula', portion: '33.3%', benefit: 'Vata regulation and digestive transit' },
        { name: 'Wild Bibhitaki', botanicalName: 'Terminalia bellirica', portion: '33.3%', benefit: 'Kapha elimination and mucous membrane tone' },
        { name: 'Fresh Amalaki (Indian Gooseberry)', botanicalName: 'Phyllanthus emblica', portion: '33.3%', benefit: 'Pitta pacification and cellular antioxidant reserve' }
      ],
      dosageInstructions: 'Mix 1 teaspoon (approx 5g) in a glass of warm water 30 minutes before bedtime.',
      anupana: 'Lukewarm water or warm ghee with raw honey.',
      storageInstructions: 'Keep tightly sealed in moisture-proof foil pouch.',
      warnings: 'Not recommended for acute diarrhea or severe dehydration.',
      doshaBalancing: { vata: true, pitta: true, kapha: true, primaryDosha: 'Tridoshic' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8843',
      batchNumber: 'AP-2026-TRI09',
      expiryMonths: 36,
      taxPercent: 5
    },
    {
      name: 'Bringadi Intensive Ayurvedic Hair & Scalp Therapy Tailam',
      slug: 'bringadi-hair-therapy-tailam',
      tagline: 'Cold-Pressed Sesame & Indigo Elixir to Prevent Premature Graying & Shedding',
      description: 'An authoritative classical formulation simmered for 96 hours with fresh Eclipta alba (Bringaraj), Neeli (Indigofera tinctoria), Karnasphota, and Gooseberry extracts in cold-pressed unrefined black sesame oil and pure goat milk. Cools Pitta-induced head heat, arrests hair shedding, and stimulates dormant follicular roots.',
      category: 'Hair Therapy & Keshya',
      subCategory: 'Keshya Tailam',
      brand: 'Axmin Prana Heritage',
      price: 1250,
      salePrice: 1099,
      sku: 'AP-BRN-004',
      stock: 35,
      packSize: '200 ml Amber Glass Bottle',
      variants: [
        { sku: 'AP-BRN-004-200', packSize: '200 ml Amber Glass Bottle', price: 1250, salePrice: 1099, stock: 35 },
        { sku: 'AP-BRN-004-400', packSize: '400 ml Twin Value Pack', price: 2200, salePrice: 1950, stock: 18 }
      ],
      format: 'Oil',
      images: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      rating: 4.88,
      reviewCount: 164,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Bhringaraj (King of Herbs for Hair)', botanicalName: 'Eclipta prostrata', portion: '25%', benefit: 'Activates hair growth cycles and stops thinning' },
        { name: 'Neelini (True Indigo)', botanicalName: 'Indigofera tinctoria', portion: '15%', benefit: 'Maintains deep natural hair pigmentation' },
        { name: 'Amla (Indian Gooseberry)', botanicalName: 'Emblica officinalis', portion: '20%', benefit: 'Strengthens keratin structure and soothes scalp' }
      ],
      dosageInstructions: 'Gently warm oil in a bowl of warm water. Part hair into sections and massage deeply into scalp using circular fingertip strokes. Leave for at least 45 minutes or overnight.',
      anupana: 'Wash off with mild Ayurvedic soapnut (Reetha) cleanser.',
      storageInstructions: 'Store in cool place. In cold winters, pure sesame oil may cloud naturally; place in warm water to clear.',
      warnings: 'External use only. Avoid contact with eyes.',
      doshaBalancing: { vata: false, pitta: true, kapha: false, primaryDosha: 'Pitta' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8844',
      batchNumber: 'AP-2026-BRN02',
      expiryMonths: 36,
      taxPercent: 12
    },
    {
      name: 'Chyawanprash Supreme Awaleha (A2 Gir Cow Ghee & Wild Amla)',
      slug: 'chyawanprash-supreme-awaleha',
      tagline: 'Ancient 52-Herb Formula Cooked in Authentic A2 Cultured Ghee & Raw Forest Honey',
      description: 'Handcrafted according to the timeless Caraka Samhita formula. Made strictly with freshly plucked wild forest Amla, A2 Desi Gir Cow cultured ghee, saffron, silver leaf, and 48 rare forest roots and herbs. Never diluted with commercial sugar syrups or preservatives. Provides unmatched respiratory resistance, stamina, and cellular rejuvenation.',
      category: 'Immunity & Rasayana',
      subCategory: 'Prana Rasayana',
      brand: 'Axmin Prana Heritage',
      price: 1350,
      salePrice: 1199,
      sku: 'AP-CHY-005',
      stock: 50,
      packSize: '500g Traditional Ceramic Jar',
      variants: [
        { sku: 'AP-CHY-005-500', packSize: '500g Traditional Ceramic Jar', price: 1350, salePrice: 1199, stock: 50 },
        { sku: 'AP-CHY-005-1000', packSize: '1kg Grand Jar', price: 2400, salePrice: 2099, stock: 25 }
      ],
      format: 'Asava/Arishta',
      images: [
        'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=600&q=80',
      rating: 4.97,
      reviewCount: 310,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Fresh Forest Amalaki Pulp', botanicalName: 'Phyllanthus emblica', portion: '45%', benefit: 'Bio-available vitamin C and deep Ojas nourishment' },
        { name: 'A2 Gir Cow Bilona Ghee', botanicalName: 'Clarified Butterfat', portion: '15%', benefit: 'Cellular lipid carrier (Yogavahi)' },
        { name: 'Wild Unprocessed Forest Honey', botanicalName: 'Apis dorsata Honey', portion: '15%', benefit: 'Preserves botanical bio-activity' }
      ],
      dosageInstructions: 'Consume 1 tablespoon (approx 15g) every morning on an empty stomach.',
      anupana: 'Follow with a cup of warm organic milk or lukewarm water.',
      storageInstructions: 'Store in a cool dry area. Use a dry wooden or stainless steel spoon only.',
      warnings: 'Consult physician if you have gestational diabetes.',
      doshaBalancing: { vata: true, pitta: true, kapha: true, primaryDosha: 'Tridoshic' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8845',
      batchNumber: 'AP-2026-CHY11',
      expiryMonths: 24,
      taxPercent: 5
    },
    {
      name: 'Brahmi & Shankhpushpi Memory & Mental Clarity Elixir',
      slug: 'brahmi-shankhpushpi-elixir',
      tagline: 'Potent Nootropic Botanical Infusion for Concentration, Memory & Calm Focus',
      description: 'Formulated with certified Bacopa monnieri and Convolvulus pluricaulis to revitalize neuro-synaptic transmission, dissipate mental fog, and quiet an overactive mind. An indispensable daily companion for students, executives, and seniors seeking sharp analytical cognition and emotional equilibrium.',
      category: 'Stress & Cognitive Health',
      subCategory: 'Medhya Rasayana',
      brand: 'Axmin Prana Heritage',
      price: 899,
      salePrice: 749,
      sku: 'AP-BRH-006',
      stock: 38,
      packSize: '60 Capsules',
      variants: [
        { sku: 'AP-BRH-006-60', packSize: '60 Capsules', price: 899, salePrice: 749, stock: 38 }
      ],
      format: 'Capsule',
      images: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
      rating: 4.82,
      reviewCount: 89,
      isFeatured: false,
      isBestseller: true,
      keyIngredients: [
        { name: 'Brahmi Whole Plant Extract', botanicalName: 'Bacopa monnieri', portion: '300 mg', benefit: 'Enhances synaptic connectivity and retention' },
        { name: 'Shankhpushpi Flower Extract', botanicalName: 'Convolvulus pluricaulis', portion: '200 mg', benefit: 'Relaxes neural hypertension and anxiety' }
      ],
      dosageInstructions: 'Take 1 capsule twice daily after meals.',
      anupana: 'Warm milk with a pinch of nutmeg or green cardamom.',
      storageInstructions: 'Store tightly closed in cool, dry conditions.',
      warnings: 'Safe for long-term daily use.',
      doshaBalancing: { vata: true, pitta: true, kapha: false, primaryDosha: 'Pitta' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8846',
      batchNumber: 'AP-2026-BRH03',
      expiryMonths: 36,
      taxPercent: 12
    },
    {
      name: 'Maha Narayan Tailam Classical Joint & Muscle Soothing Oil',
      slug: 'maha-narayan-joint-tailam',
      tagline: '54 Traditional Herb Extraction to Dissolve Muscle Spasms & Joint Stiffness',
      description: 'An ancient classical Ayurvedic tailam enriched with Dashamoola roots, Shatavari, Ashwagandha, and Camphor cooked in pure sesame oil. Enters deep connective fascia to soothe Vata entrapment, restore joint mobility, and ease post-workout stiffness or age-related degeneration.',
      category: 'Joint Care & Sandhi',
      subCategory: 'Vatahara Tailam',
      brand: 'Axmin Prana Heritage',
      price: 849,
      salePrice: 719,
      sku: 'AP-NAR-007',
      stock: 42,
      packSize: '200 ml Dispenser Flacon',
      variants: [
        { sku: 'AP-NAR-007-200', packSize: '200 ml Dispenser Flacon', price: 849, salePrice: 719, stock: 42 }
      ],
      format: 'Oil',
      images: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      rating: 4.87,
      reviewCount: 76,
      isFeatured: false,
      isBestseller: false,
      keyIngredients: [
        { name: 'Dashamoola Roots (Ten Roots)', botanicalName: 'Dashamoola Complex', portion: '20%', benefit: 'Premier Vata-pacifier for musculoskeletal comfort' },
        { name: 'Bala (Country Mallow)', botanicalName: 'Sida cordifolia', portion: '15%', benefit: 'Strengthens tendon resistance and muscle fibers' }
      ],
      dosageInstructions: 'Warm gently and massage over affected joints and back using firm, rhythmic motions for 15 minutes before hot shower.',
      anupana: 'Follow with warm fomentation (Swedana) or hot towel compress.',
      storageInstructions: 'Store in a dry location away from cold drafts.',
      warnings: 'Do not apply to open cuts, burns, or broken skin.',
      doshaBalancing: { vata: true, pitta: false, kapha: false, primaryDosha: 'Vata' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8847',
      batchNumber: 'AP-2026-NAR01',
      expiryMonths: 36,
      taxPercent: 12
    },
    {
      name: 'Organic Guduchi (Giloy) Supreme Immunity Drops',
      slug: 'organic-guduchi-giloy-drops',
      tagline: 'Amrita “The Nectar of Immortality” Concentrated Aqueous Extract',
      description: 'Derived exclusively from wild Giloy vines climbing Neem trees (Neem-Guduchi), imparting exceptional antipyretic, detoxifying, and leukocyte-stimulating potency. Helps regulate bodily temperature, purifies hepatic blood circulation, and reinforces cellular immunity against seasonal environmental stressors.',
      category: 'Immunity & Rasayana',
      subCategory: 'Rakta Shodhaka',
      brand: 'Axmin Prana Heritage',
      price: 649,
      salePrice: 529,
      sku: 'AP-GIL-008',
      stock: 58,
      packSize: '50 ml Concentrated Dropper Bottle',
      variants: [
        { sku: 'AP-GIL-008-50', packSize: '50 ml Concentrated Dropper Bottle', price: 649, salePrice: 529, stock: 58 }
      ],
      format: 'Asava/Arishta',
      images: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
      rating: 4.81,
      reviewCount: 112,
      isFeatured: false,
      isBestseller: false,
      keyIngredients: [
        { name: 'Neem-Grown Giloy Stem Extract', botanicalName: 'Tinospora cordifolia', portion: '100%', benefit: 'Boosts platelet integrity and leukocyte defenses' }
      ],
      dosageInstructions: 'Add 15 to 20 drops in half a glass of lukewarm water every morning.',
      anupana: 'Lukewarm water with raw honey.',
      storageInstructions: 'Refrigerate after opening or store below 25°C.',
      warnings: 'Consult physician if currently taking autoimmune immunosuppressants.',
      doshaBalancing: { vata: false, pitta: true, kapha: true, primaryDosha: 'Pitta' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8848',
      batchNumber: 'AP-2026-GIL05',
      expiryMonths: 24,
      taxPercent: 5
    },
    {
      name: 'Vadha Ranjaga Thailam (Pain Relief Oil)',
      slug: 'vadha-ranjaga-thailam',
      tagline: 'Classical Medicated Oil for Rapid Joint, Nerve & Muscular Pain Relief',
      description: 'An authoritative classical Ayurvedic medicated tailam formulated for intense musculoskeletal relief. Handcrafted with potent pain-relieving botanicals including Gandhapura (Wintergreen), Karpoora (Camphor), Nilgiri (Eucalyptus), and Dashamoola cooked in pure unrefined sesame oil. Deeply penetrates sore joints, cartilage, and tense muscle tissues to alleviate aggravated Vata dosha, arthritic swelling, lumbar stiffness, neck strain, and sports injuries.',
      category: 'Joint Care & Sandhi',
      subCategory: 'Sandhi Shoola Tailam',
      brand: 'Axmin Prana Heritage',
      price: 499,
      salePrice: 399,
      sku: 'AP-VRT-009',
      stock: 50,
      packSize: '100 ml Dispenser Flacon',
      variants: [
        { sku: 'AP-VRT-009-100', packSize: '100 ml Dispenser Flacon', price: 499, salePrice: 399, stock: 50 },
        { sku: 'AP-VRT-009-200', packSize: '200 ml Value Flacon', price: 899, salePrice: 699, stock: 35 }
      ],
      format: 'Oil',
      images: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      rating: 4.93,
      reviewCount: 92,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Gandhapura Taila (Wintergreen Oil)', botanicalName: 'Gaultheria procumbens', portion: '18%', benefit: 'Potent natural analgesic that relieves joint and muscular tension' },
        { name: 'Karpoora (Camphor)', botanicalName: 'Cinnamomum camphora', portion: '10%', benefit: 'Relieves acute inflammation and stimulates regional microcirculation' },
        { name: 'Nilgiri Taila (Eucalyptus)', botanicalName: 'Eucalyptus globulus', portion: '12%', benefit: 'Deep-penetrating soothing action for cervical and back spasms' },
        { name: 'Mahanarayana & Dashamoola Complex', botanicalName: 'Polyherbal Formulation', portion: '40%', benefit: 'Pacifies aggravated Vata dosha and restores joint lubrication' }
      ],
      dosageInstructions: 'Take 5 to 10 ml of warm oil and apply over affected joints, back, or neck. Massage gently in rhythmic circular strokes for 10-15 minutes until absorbed.',
      anupana: 'Follow with warm fomentation (Swedana) or hot towel compress for enhanced relief.',
      storageInstructions: 'Store tightly capped in a dry, cool area away from direct sunlight.',
      warnings: 'For external topical application only. Do not apply on open abrasions, cuts, or mucous membranes.',
      doshaBalancing: { vata: true, pitta: false, kapha: true, primaryDosha: 'Vata' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8849',
      batchNumber: 'AP-2026-VRT01',
      expiryMonths: 36,
      taxPercent: 12
    },
    {
      name: 'Thalis Powder (Ulcer Relief Medicine)',
      slug: 'thalis-powder',
      tagline: 'Classical Ayurvedic Churna for Gastric Ulcers, Hyperacidity & Gut Soothing',
      description: 'Prescribed in the classical Ayurvedic texts of Sharangadhara Samhita and Charaka Samhita. Handcrafted with Talisapatra (Himalayan Silver Fir), Vanshalochan, Cardamom, Cinnamon, and Trikatu. Exceptionally potent in cooling aggravated Pitta, restoring the natural gastric mucosal protective barrier, soothing peptic and duodenal ulcers, pacifying acid reflux, and healing chronic indigestion.',
      category: 'Digestive & Gut Health',
      subCategory: 'Amlapitta & Ulcer Care',
      brand: 'Axmin Prana Heritage',
      price: 349,
      salePrice: 279,
      sku: 'AP-THP-010',
      stock: 60,
      packSize: '100g Pure Herbal Powder',
      variants: [
        { sku: 'AP-THP-010-100', packSize: '100g Sealed Foil Pouch', price: 349, salePrice: 279, stock: 60 },
        { sku: 'AP-THP-010-200', packSize: '200g Value Ceramic Jar', price: 649, salePrice: 499, stock: 40 }
      ],
      format: 'Churna',
      images: [
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
      rating: 4.89,
      reviewCount: 96,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Talisapatra (Himalayan Silver Fir)', botanicalName: 'Abies webbiana', portion: '15%', benefit: 'Relieves stomach burning, mucosal irritation, and pacifies gastric Vata' },
        { name: 'Vanshalochan (Bamboo Manna)', botanicalName: 'Bambusa arundinacea', portion: '25%', benefit: 'Rebuilds ulcerated epithelial lining and cools excess digestive heat' },
        { name: 'Ela (Cardamom) & Twak (Cinnamon)', botanicalName: 'Elettaria cardamomum & Cinnamomum verum', portion: '20%', benefit: 'Eliminates gas, acid reflux, nausea, and sour belching' },
        { name: 'Shunthi & Pippali (Ginger & Long Pepper)', botanicalName: 'Zingiber officinale & Piper longum', portion: '20%', benefit: 'Kindles digestive fire (Deepana) without aggravating stomach heat' }
      ],
      dosageInstructions: 'Mix 2 to 3 grams (approx. half teaspoon) twice daily after meals with raw honey, warm water, or pure cow ghee.',
      anupana: 'Raw unprocessed honey or lukewarm water.',
      storageInstructions: 'Store sealed in a cool, dry place. Keep protected from humidity and moisture.',
      warnings: 'Consult an Ayurvedic practitioner if pregnant or undergoing specific ulcer surgical treatment.',
      doshaBalancing: { vata: true, pitta: true, kapha: false, primaryDosha: 'Pitta' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8850',
      batchNumber: 'AP-2026-THP01',
      expiryMonths: 24,
      taxPercent: 5
    },
    {
      name: 'AXMIN KESHAVEDA Herbal Hair Oil',
      slug: 'axmin-keshaveda-herbal-hair-oil',
      tagline: 'Sacred 21-Herb Kshirapak Elixir for Hair Fall Control, Density & Dandruff Relief',
      description: 'A master classical formulation of 21 sacred botanical herbs slow-simmered in virgin coconut oil and cold-pressed black sesame oil according to ancient Kshirapak Vidhi. AXMIN KESHAVEDA deeply nourishes roots, pacifies scalp Pitta heat, arrests premature shedding, combats stubborn dandruff and scalp flaking, and bestows intense natural dark shine and silky density.',
      category: 'Hair Therapy & Keshya',
      subCategory: 'Keshya Rasayana Tailam',
      brand: 'Axmin Prana Heritage',
      price: 699,
      salePrice: 549,
      sku: 'AP-KSH-011',
      stock: 75,
      packSize: '200 ml Amber Dispenser Bottle',
      variants: [
        { sku: 'AP-KSH-011-100', packSize: '100 ml Dropper Flacon', price: 399, salePrice: 329, stock: 50 },
        { sku: 'AP-KSH-011-200', packSize: '200 ml Amber Dispenser Bottle', price: 699, salePrice: 549, stock: 75 },
        { sku: 'AP-KSH-011-400', packSize: '400 ml Twin Value Pack', price: 1299, salePrice: 999, stock: 30 }
      ],
      format: 'Oil',
      images: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      rating: 4.97,
      reviewCount: 168,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Bhringaraj (King of Hair)', botanicalName: 'Eclipta prostrata', portion: '25%', benefit: 'Activates dormant follicles, prevents hair thinning, and halts fallout' },
        { name: 'Neelini (Pure Indigofera)', botanicalName: 'Indigofera tinctoria', portion: '15%', benefit: 'Maintains rich natural pigment and prevents premature graying' },
        { name: 'Amla & Brahmi Complex', botanicalName: 'Phyllanthus emblica & Bacopa monnieri', portion: '20%', benefit: 'Cools scalp Pitta heat, relieves tension, and accelerates growth' },
        { name: 'Methi (Fenugreek) & Cold-Pressed Virgin Oils', botanicalName: 'Trigonella foenum-graecum', portion: '25%', benefit: 'Eliminates dandruff, conditions itchy scalp, and seals hydration' }
      ],
      dosageInstructions: 'Part hair into sections. Apply 10 to 15 ml and gently massage into scalp with circular fingertip pressure for 10 minutes. Leave for at least 1 hour or overnight.',
      anupana: 'Wash off with mild sulfate-free herbal cleanser or Reetha / Shikakai wash.',
      storageInstructions: 'Store in cool ambient conditions away from direct heat. In cold weather, warm bottle in warm water to clear natural clouding.',
      warnings: 'For external hair and scalp application only. In case of eye contact, rinse thoroughly with water.',
      doshaBalancing: { vata: false, pitta: true, kapha: false, primaryDosha: 'Pitta' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8851',
      batchNumber: 'AP-2026-KSH01',
      expiryMonths: 36,
      taxPercent: 12
    }
  ]);

  console.log('[Seed] Creating Coupons...');
  await Coupon.create([
    {
      code: 'PRANA10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 500,
      maxDiscount: 300,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date('2028-12-31')
    },
    {
      code: 'VEDA20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 1500,
      maxDiscount: 600,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date('2028-12-31')
    },
    {
      code: 'AYUSH50',
      discountType: 'fixed',
      discountValue: 150,
      minOrderValue: 999,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date('2028-12-31')
    }
  ]);

  console.log('[Seed] Creating Educational Articles...');
  await Article.create([
    {
      title: 'Dinacharya: The Vedic Science of Daily Health & Rhythms',
      slug: 'dinacharya-vedic-daily-rhythm',
      excerpt: 'Aligning your diurnal biological clock with the natural solar cycles: wake up, tongue scraping, oil pulling, and conscious nourishment.',
      content: 'In the ancient wisdom of the Charaka Samhita, health is not simply the absence of symptoms, but a harmonious alignment between the microcosm of human physiology and the macrocosm of nature. Dinacharya (the daily routine) represents the foundational discipline of Ayurvedic longevity...',
      category: 'Ayurveda Lifestyle',
      author: 'Dr. Vaidya Ramanathan (BAMS, MD Ayu)',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80',
      tags: ['Dinacharya', 'Daily Routine', 'Longevity', 'Dosha Balance']
    },
    {
      title: 'Deciphering Your Prakriti: Vata, Pitta, and Kapha Explored',
      slug: 'deciphering-your-prakriti-doshas',
      excerpt: 'Discover your unique constitutional blueprint and learn how seasonal food, climate, and herbal medicine interact with your dosha.',
      content: 'Every human being is born with a distinct ratio of the five great elements: Space, Air, Fire, Water, and Earth. In Ayurveda, this elemental blueprint is called Prakriti. Understanding whether Vata, Pitta, or Kapha dominates your constitution unlocks personalized nutrition and preventative healthcare...',
      category: 'Dosha Science',
      author: 'Dr. Sunita Deshmukh (Ayurvedic Practitioner)',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=80',
      tags: ['Prakriti', 'Vata', 'Pitta', 'Kapha', 'Ayurvedic Principles']
    },
    {
      title: 'The Sacred Alchemy of Triphala: Why Every Household Needs It',
      slug: 'sacred-alchemy-of-triphala',
      excerpt: 'Explore the synergistic power of Amalaki, Bibhitaki, and Haritaki—the three revered fruits that kindle agni and soothe all tissues.',
      content: 'Known throughout Vedic lore as a mother who cares for internal organs as an affectionate mother cares for her child, Triphala remains the most prescribed Rasayana formulation across the Indian subcontinent...',
      category: 'Herbal Monograph',
      author: 'Vaidya Ananth Sharma',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1000&q=80',
      tags: ['Triphala', 'Gut Health', 'Detox', 'Herbal Medicine']
    }
  ]);

  console.log('[Seed] Database successfully seeded with 8 authentic products, 6 categories, 3 coupons, 3 articles, and 2 users.');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed] Error seeding database:', err);
  process.exit(1);
});
