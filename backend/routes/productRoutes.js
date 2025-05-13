import express from "express";
import { 
    getProducts, 
    createProduct, 
    getProduct, 
    updateProduct, 
    deleteProduct, 
    getProductsByCategory 
} from "../controllers/productController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", getProduct);
router.post("/", protectRoute, createProduct);
router.put("/:id", protectRoute, updateProduct);
router.delete("/:id", protectRoute, deleteProduct);

export default router;
