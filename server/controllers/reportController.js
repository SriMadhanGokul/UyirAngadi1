import Report from '../models/Report.js';
import Listing from '../models/Listing.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const createReport = catchAsync(async (req, res, next) => {
  const { listingId, reason, description } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing) return next(new AppError('Listing not found', 404));

  const report = await Report.create({
    reporter: req.user._id,
    listing: listingId,
    reason,
    description,
    status: 'OPEN',
  });

  res.status(201).json({
    status: 'success',
    message: 'Thank you. Our team will review this listing.',
    data: report,
  });
});

export const getMyReports = catchAsync(async (req, res) => {
  const reports = await Report.find({ reporter: req.user._id })
    .populate('listing', 'title photos price location status')
    .sort({ createdAt: -1 });

  res.status(200).json({ status: 'success', results: reports.length, data: reports });
});
