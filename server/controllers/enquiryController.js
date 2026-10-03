import Enquiry from '../models/Enquiry.js';
import Listing from '../models/Listing.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const createEnquiry = catchAsync(async (req, res, next) => {
  const { listingId, contactMethod } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing) return next(new AppError('Listing not found', 404));

  const enquiry = await Enquiry.create({
    buyer: req.user ? req.user._id : null,
    seller: listing.seller,
    listing: listing._id,
    contactMethod,
  });

  res.status(201).json({ status: 'success', data: enquiry });
});

export const getMyEnquiries = catchAsync(async (req, res) => {
  const enquiries = await Enquiry.find({ buyer: req.user._id })
    .populate('listing', 'title photos price location status')
    .populate('seller', 'name phone')
    .sort({ createdAt: -1 });

  res.status(200).json({ status: 'success', results: enquiries.length, data: enquiries });
});
