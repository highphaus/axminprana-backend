const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/axminprana_ayurveda';

async function run() {
  await mongoose.connect(uri);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const existing = await Product.findOne({ slug: 'nalpamaradi-skin-radiance-thailam' });
  if (!existing) {
    await Product.create({
      name: 'Nalpamaradi Thailam Skin Brightening & De-tan Oil',
      slug: 'nalpamaradi-skin-radiance-thailam',
      tagline: 'Classical Turmeric & 4 Ficus Barks Complex for Natural Glow & Sun Repair',
      description: 'Prescribed in the Sahasrayogam for complexion enhancement, natural tan removal, and pigmentation repair. Formulated with wild turmeric (Kasturi Manjal) and the sacred Nalpamara group of trees.',
      category: 'Skin Radiance & Kanti',
      subCategory: 'Varnya Tailam',
      brand: 'Axmin Prana Heritage',
      price: 899,
      salePrice: 749,
      sku: 'AP-NAL-001',
      stock: 50,
      packSize: '100 ml',
      variants: [
        { sku: 'AP-NAL-001-100', packSize: '100 ml', price: 899, salePrice: 749, stock: 50 },
        { sku: 'AP-NAL-001-200', packSize: '200 ml', price: 1599, salePrice: 1349, stock: 30 }
      ],
      format: 'Oil',
      images: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      reviewCount: 118,
      isFeatured: true,
      isBestseller: true,
      keyIngredients: [
        { name: 'Kasturi Manjal (Wild Turmeric)', botanicalName: 'Curcuma aromatica', portion: '20%', benefit: 'Evens skin tone and clears tanning' },
        { name: 'Nalpamara (Four Sacred Ficus Barks)', botanicalName: 'Ficus Complex', portion: '40%', benefit: 'Purifies skin micro-channels and heals blemishes' },
        { name: 'Pure Sesame Oil', botanicalName: 'Sesamum indicum', portion: '40%', benefit: 'Nourishes deep lipid layers' }
      ],
      dosageInstructions: 'Gently massage warm oil onto face and body 30 minutes before bathing. Wash off with warm water and herbal ubtan.',
      anupana: 'Warm water wash or herbal bath powder.',
      storageInstructions: 'Store in a cool dry place away from sunlight.',
      warnings: 'For external use only. Natural turmeric may impart temporary yellow hue that washes away.',
      doshaBalancing: { vata: true, pitta: true, kapha: false, primaryDosha: 'Pitta' },
      ayushLicenseNumber: 'AYU/DL/IND-2024-8859',
      batchNumber: 'AP-2026-NAL01',
      expiryMonths: 36,
      taxPercent: 12
    });
    console.log('Inserted Nalpamaradi Thailam successfully!');
  } else {
    console.log('Nalpamaradi Thailam already exists.');
  }

  const allOils = await Product.find({ format: 'Oil' }).countDocuments();
  const allOthers = await Product.find({ format: { $ne: 'Oil' } }).countDocuments();
  console.log('Total Oils in DB:', allOils, '| Total Other Formulations in DB:', allOthers);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
