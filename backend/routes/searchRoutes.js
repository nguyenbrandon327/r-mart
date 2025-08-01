import express from 'express';
import { searchProducts, getSearchSuggestions } from '../controllers/searchController.js';
import { checkAuth } from '../utils/checkAuth.js';

const router = express.Router();

// Search products (with optional auth for distance sorting)
router.get('/products', checkAuth, searchProducts);

// Get search suggestions (autocomplete)
router.get('/suggestions', getSearchSuggestions);

export default router; 