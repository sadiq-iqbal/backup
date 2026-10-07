const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

/**
 * Helper to upload image to Cloudinary (API credentials or Unsigned Upload Preset),
 * falling back to local static disk storage if Cloudinary is unconfigured or fails.
 */
async function processImageUpload(file, userId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  const isCloudinaryConfigured =
    cloudName &&
    cloudName.trim() !== '' &&
    cloudName !== 'your_cloud_name' &&
    (
      (apiKey && apiKey !== 'your_api_key' && apiSecret && apiSecret !== 'your_api_secret') ||
      (uploadPreset && uploadPreset.trim() !== '' && uploadPreset !== 'your_upload_preset')
    );

  let imageUrl = '';

  if (isCloudinaryConfigured) {
    try {
      if (apiKey && apiKey !== 'your_api_key' && apiSecret && apiSecret !== 'your_api_secret') {
        // Signed upload via Cloudinary SDK stream
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });

        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'fitbid_avatars', resource_type: 'image' },
            (error, res) => {
              if (error) reject(error);
              else resolve(res);
            }
          );
          stream.end(file.buffer);
        });

        imageUrl = result.secure_url;
        console.log('✅ Uploaded to Cloudinary (SDK):', imageUrl);
      } else if (uploadPreset) {
        // Unsigned upload via REST API using URLSearchParams
        const b64 = file.buffer.toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        const params = new URLSearchParams();
        params.append('file', dataURI);
        params.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        });

        const data = await response.json();
        if (data.secure_url) {
          imageUrl = data.secure_url;
          console.log('✅ Uploaded to Cloudinary (Unsigned Preset):', imageUrl);
        } else {
          throw new Error(data.error?.message || JSON.stringify(data));
        }
      }
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary upload error, using local storage fallback:', cloudErr.message);
    }
  } else {
    console.log('ℹ️ Cloudinary credentials not configured in .env; using local disk storage.');
  }

  // Fallback to local storage if Cloudinary did not return a URL
  if (!imageUrl) {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `avatar-${userId}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    imageUrl = `/uploads/${filename}`;
    console.log('📁 Saved to local disk:', imageUrl);
  }

  return imageUrl;
}

// POST /api/upload - Upload an image file (returns { url })
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = await processImageUpload(req.file, req.user._id);
    res.json({ url });
  } catch (err) {
    console.error('Upload endpoint error:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

// POST /api/upload/avatar - Upload avatar and immediately update user profile
router.post('/avatar', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const avatarUrl = await processImageUpload(req.file, req.user._id);

    // Update user avatar in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({ avatar: avatarUrl, user: updatedUser });
  } catch (err) {
    console.error('Avatar upload endpoint error:', err);
    res.status(500).json({ error: err.message || 'Avatar upload failed' });
  }
});

module.exports = router;
