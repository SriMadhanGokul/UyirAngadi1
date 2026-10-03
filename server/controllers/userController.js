import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import { uploadMedia } from '../services/uploadService.js';

export const updateMe = catchAsync(async (req, res) => {
  const allowed = ['name', 'location'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({ status: 'success', user });
});

export const uploadProfileImage = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'fail', message: 'No image uploaded' });
  }
  const url = await uploadMedia(req.file, 'image');
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: url },
    { returnDocument: 'after' }
  );
  res.status(200).json({ status: 'success', user });
});
