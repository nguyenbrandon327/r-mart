import express from 'express';
import { searchProducts, getSearchSuggestions } from '../controllers/searchController.js';

const router = express.Router();

// Search products
router.get('/products', searchProducts);

// Get search suggestions (autocomplete)
router.get('/suggestions', getSearchSuggestions);

export default router; 