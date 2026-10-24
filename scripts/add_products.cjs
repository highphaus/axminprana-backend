const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/axminprana_ayurveda';

const newProducts = [
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
    taxPercent: 12,
    createdAt: new Date(),
    updatedAt: new Date()
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
    taxPercent: 5,
    createdAt: new Date(),
    updatedAt: new Date()
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
    taxPercent: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const collection = mongoose.connection.collection('products');

  for (const prod of newProducts) {
    const existing = await collection.findOne({ slug: prod.slug });
    if (existing) {
      console.log(`Product "${prod.name}" already exists. Updating...`);
      await collection.updateOne({ slug: prod.slug }, { $set: prod });
      console.log(`Updated "${prod.name}".`);
    } else {
      console.log(`Inserting product "${prod.name}"...`);
      await collection.insertOne(prod);
      console.log(`Inserted "${prod.name}" successfully!`);
    }
  }

  // Also update category productCounts
  const categoriesCollection = mongoose.connection.collection('categories');
  await categoriesCollection.updateOne(
    { slug: 'joint-muscle-care' },
    { $inc: { productCount: 1 } }
  );
  await categoriesCollection.updateOne(
    { slug: 'digestive-gut' },
    { $inc: { productCount: 1 } }
  );
  await categoriesCollection.updateOne(
    { slug: 'hair-therapy' },
    { $inc: { productCount: 1 } }
  );

  console.log('Categories updated!');
  const allProds = await collection.find({}, { projection: { name: 1, slug: 1, category: 1 } }).toArray();
  console.log('Total products now in DB:', allProds.length);
  console.log(allProds);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

run().catch(err => {
  console.error('Error adding products:', err);
  process.exit(1);
});
