import { Router } from 'express';
import { Product } from '../models/Product.js';

const router = Router();

// GET /api/products (Filtering, Sorting, Searching, Pagination)
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      dosha,
      format,
      minPrice,
      maxPrice,
      sort = 'popularity',
      search,
      isFeatured,
      isBestseller
    } = req.query;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (dosha) {
      if (dosha === 'Tridoshic') {
        query['doshaBalancing.primaryDosha'] = 'Tridoshic';
      } else {
        query[`doshaBalancing.${(dosha as string).toLowerCase()}`] = true;
      }
    }

    if (format) {
      query.format = format;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    if (isBestseller === 'true') {
      query.isBestseller = true;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { tagline: searchRegex },
        { description: searchRegex },
        { 'keyIngredients.name': searchRegex },
        { 'keyIngredients.botanicalName': searchRegex }
      ];
    }

    // Sort order
    let sortOptions: any = {};
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1, reviewCount: -1 };
    } else {
      // Popularity / Bestseller default
      sortOptions = { isBestseller: -1, rating: -1, reviewCount: -1 };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Projection to save bandwidth
    const projection = 'name slug tagline category brand price salePrice stock packSize format thumbnail rating reviewCount isFeatured isBestseller doshaBalancing';

    const [products, total] = await Promise.all([
      Product.find(query).select(projection).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/slug/:slug
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Fetch related products
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    })
      .select('name slug tagline price salePrice thumbnail rating reviewCount packSize')
      .limit(4)
      .lean();

    res.json({
      success: true,
      data: {
        ...product,
        related
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/featured
router.get('/featured', async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .select('name slug tagline category price salePrice stock packSize format thumbnail rating reviewCount isBestseller doshaBalancing')
      .limit(8)
      .lean();

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/bestsellers
router.get('/bestsellers', async (req, res, next) => {
  try {
    const products = await Product.find({ isBestseller: true })
      .select('name slug tagline category price salePrice stock packSize format thumbnail rating reviewCount isBestseller doshaBalancing')
      .limit(8)
      .lean();

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

export default router;
