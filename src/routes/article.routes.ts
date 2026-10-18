import { Router } from 'express';
import { Article } from '../models/Article.js';

const router = Router();

// GET /api/articles
router.get('/', async (req, res, next) => {
  try {
    const articles = await Article.find({ isPublished: true }).sort({ publishedAt: -1 }).lean();
    res.json({ success: true, data: articles });
  } catch (err) {
    next(err);
  }
});

// GET /api/articles/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, isPublished: true }).lean();
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
});

export default router;
