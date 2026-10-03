import Favourite from '../models/Favourite.js';
import Listing from '../models/Listing.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getMyFavourites = catchAsync(async (req, res) => {
  const favourites = await Favourite.find({ user: req.user._id })
    .populate({
      path: 'listing',
      populate: { path: 'seller', select: 'name phone createdAt' },
    })
    .sort({ createdAt: -1 });

  const data = favourites
    .filter((favourite) => favourite.listing)
    .map((favourite) => ({
      ...favourite.toObject(),
      listing: favourite.listing && typeof favourite.listing.toObject === 'function'
        ? favourite.listing.toObject()
        : favourite.listing,
    }));

  res.status(200).json({ status: 'success', results: data.length, data });
});

export const addFavourite = catchAsync(async (req, res, next) => {
  const { listingId } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing) return next(new AppError('Listing not found', 404));

  const existing = await Favourite.findOne({ user: req.user._id, listing: listingId });
  if (existing) {
    return res.status(200).json({ status: 'success', data: existing, alreadySaved: true });
  }

  const favourite = await Favourite.create({ user: req.user._id, listing: listingId });
  res.status(201).json({ status: 'success', data: favourite });
});

export const removeFavourite = catchAsync(async (req, res) => {
  await Favourite.findOneAndDelete({ user: req.user._id, listing: req.params.listingId });
  res.status(204).json({ status: 'success', data: null });
});
