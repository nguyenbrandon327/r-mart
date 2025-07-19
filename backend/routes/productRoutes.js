import express from "express";
import { 
    getProducts, 
    createProduct, 
    getProduct, 
    updateProduct, 
    deleteProduct, 
    getProductsByCategory,
    deleteProductImage,
    getSellerOtherProducts,
    markProductAsSold,
    markProductAsAvailable
} from "../controllers/productController.js";
import { protectRoute } from "../utils/protectRoute.js";
import { checkAuth } from "../utils/checkAuth.js";
import { upload } from "../utils/s3.js";

const router = express.Router();

router.get("/", checkAuth, getProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", checkAuth, getProduct);
router.get("/seller/:userId/other/:excludeProductId", getSellerOtherProducts);

router.post("/", protectRoute, upload.array('productImages', 5), createProduct);
router.put("/:id", protectRoute, upload.array('productImages', 5), updateProduct);
router.delete("/:id", protectRoute, deleteProduct);

// Route to delete a single image from a product
router.delete("/:id/image", protectRoute, deleteProductImage);

// Routes to mark product as sold/available
router.patch("/:id/sold", protectRoute, markProductAsSold);
router.patch("/:id/available", protectRoute, markProductAsAvailable);

export default router;
