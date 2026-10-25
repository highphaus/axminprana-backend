const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/axminprana_ayurveda';

async function update() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.collection('products');

  await col.updateOne(
    { slug: 'vadha-ranjaga-thailam' },
    {
      $set: {
        name: 'Vadha Ranjaga Thailam (Pain Relief Oil)',
        subCategory: 'Pain Relief Oil',
        isBestseller: true,
        isFeatured: true
      }
    }
  );

  await col.updateOne(
    { slug: 'thalis-powder' },
    {
      $set: {
        name: 'Thalis Powder (Ulcer Relief Medicine)',
        subCategory: 'Ulcer Relief Medicine',
        isBestseller: true,
        isFeatured: true
      }
    }
  );

  await col.updateOne(
    { slug: 'axmin-keshaveda-herbal-hair-oil' },
    {
      $set: {
        name: 'AXMIN KESHAVEDA Herbal Hair Oil',
        subCategory: 'Herbal Hair Oil',
        isBestseller: true,
        isFeatured: true
      }
    }
  );

  console.log('Successfully updated the 3 flagship products in MongoDB!');
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
