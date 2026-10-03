import express from "express";
import {
  getListings,
  getListingById,
  getSoldHistory,
  createListing,
  updateListing,
  updateListingMedia,
  deleteListing,
  markAsSold,
} from "../controllers/listingController.js";
import { protect } from "../middleware/auth.js";
import { uploadListingMedia } from "../middleware/upload.js";
import {
  validateBody,
  validateQuery,
  sanitizeRequest,
} from "../middleware/validate.js";
import { listingQuerySchema, markSoldSchema } from "../utils/validators.js";
import { writeLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/", validateQuery(listingQuerySchema), getListings);
router.get(
  "/sold-history",
  protect,
  validateQuery(listingQuerySchema),
  getSoldHistory,
);
router.get("/:id", getListingById);

router.use(protect, sanitizeRequest);
router.post("/", writeLimiter, uploadListingMedia, createListing);
router.put("/:id", writeLimiter, updateListing);
router.put("/:id/media", writeLimiter, uploadListingMedia, updateListingMedia);
router.delete("/:id", writeLimiter, deleteListing);
router.patch(
  "/:id/sold",
  writeLimiter,
  validateBody(markSoldSchema),
  markAsSold,
);

export default router;
