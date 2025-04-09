const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../lib/mongodb');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/user');
const AstrologerProfile = require('../models/astrologer');
const Message = require('../models/message');
const Chat = require('../models/chat');

// Get all verified astrologers
router.get('/', async (req, res) => {
  try {
    const astrologers = await User.find({ 
      role: 'astrologer',
      isVerified: true 
    }).select('-password');

    const formattedAstrologers = astrologers.map(astrologer => ({
      _id: astrologer._id,
      name: astrologer.name,
      email: astrologer.email,
      experience: astrologer.experience || '0 years',
      expertise: astrologer.expertise || [],
      languages: astrologer.languages || [],
      price: astrologer.price || {
        original: 500,
        discounted: 400
      },
      rating: astrologer.rating || 0,
      totalRatings: astrologer.totalRatings || 0,
      availability: {
        online: astrologer.availability?.online || false,
        startTime: astrologer.availability?.startTime || '09:00',
        endTime: astrologer.availability?.endTime || '18:00'
      },
      status: {
        chat: astrologer.availability?.online || false,
        call: astrologer.availability?.online || false
      },
      profileImage: astrologer.profileImage,
      isOnline: astrologer.availability?.online || false
    }));

    res.json(formattedAstrologers);
  } catch (error) {
    console.error('Error fetching astrologers:', error);
    res.status(500).json({ error: 'Failed to fetch astrologers' });
  }
});

// Get astrologer's chat history
router.get('/chats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'astrologer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const chats = await Chat.find({ astrologerId: req.user.id })
      .sort({ endTime: -1 }) // Sort by most recent
      .limit(20) // Limit to last 20 chats
      .populate('userId', 'name profileImage');

    const formattedChats = chats.map(chat => ({
      id: chat._id,
      userId: chat.userId._id,
      userName: chat.userId.name,
      userAvatar: chat.userId.profileImage,
      lastMessage: chat.lastMessage,
      timestamp: chat.endTime,
      duration: chat.duration,
      earning: chat.amount
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get astrologer's earnings
router.get('/earnings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'astrologer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Aggregate earnings from chats
    const chats = await Chat.aggregate([
      {
        $match: {
          astrologerId: new ObjectId(req.user.id),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          today: {
            $sum: {
              $cond: [{ $gte: ['$endTime', today] }, '$amount', 0]
            }
          },
          thisWeek: {
            $sum: {
              $cond: [{ $gte: ['$endTime', weekStart] }, '$amount', 0]
            }
          },
          thisMonth: {
            $sum: {
              $cond: [{ $gte: ['$endTime', monthStart] }, '$amount', 0]
            }
          },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const earnings = chats[0] || {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0
    };

    res.json(earnings);
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// Get single astrologer
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const astrologer = await User.findById(req.params.id)
      .select('-password') // Exclude password
      .lean(); // Convert to plain JavaScript object
    
    if (!astrologer) {
      return res.status(404).json({
        success: false,
        error: 'Astrologer not found'
      });
    }

    // Format the response
    const formattedAstrologer = {
      _id: astrologer._id,
      name: astrologer.name,
      email: astrologer.email,
      experience: astrologer.experience || '0 years',
      expertise: astrologer.expertise || [],
      languages: astrologer.languages || [],
      price: astrologer.price || {
        original: 500,
        discounted: 400
      },
      rating: astrologer.rating || 0,
      totalRatings: astrologer.totalRatings || 0,
      availability: astrologer.availability || {
        online: false,
        startTime: '09:00',
        endTime: '18:00'
      },
      status: astrologer.status || {
        chat: false,
        call: false
      },
      profileImage: astrologer.profileImage,
      isOnline: astrologer.isOnline || false
    };

    res.json({
      success: true,
      astrologer: formattedAstrologer
    });
  } catch (error) {
    console.error('Error fetching astrologer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch astrologer details'
    });
  }
});

// Create astrologer
router.post('/', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    const astrologer = {
      name: req.body.name,
      email: req.body.email,
      image: req.body.image || 'https://via.placeholder.com/150',
      rating: 0,
      languages: req.body.languages || [],
      expertise: req.body.expertise || [],
      experience: req.body.experience || '0 years',
      price: {
        original: req.body.price || 500,
        discounted: req.body.discountedPrice || 400,
      },
      consultations: 0,
      status: {
        chat: true,
        call: true,
      },
      bestPrice: false,
      description: req.body.description || '',
      availability: 'Online',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('astrologers').insertOne(astrologer);
    
    return res.status(201).json({
      ...astrologer,
      _id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating astrologer:', error);
    return res.status(500).json({ error: 'Failed to create astrologer' });
  }
});

// Get astrologer profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'astrologer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let profile = await AstrologerProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      // Create default profile if it doesn't exist
      profile = await AstrologerProfile.create({
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: '',
        experience: '',
        expertise: [],
        languages: [],
        about: '',
        price: {
          original: 0,
          discounted: 0
        },
        availability: {
          online: false,
          startTime: '09:00',
          endTime: '18:00'
        },
        rating: 0,
        totalRatings: 0,
        isVerified: true // Add this to show in consult-astro page
      });

      // Also update the user document
      await User.findByIdAndUpdate(req.user.id, {
        experience: profile.experience,
        expertise: profile.expertise,
        languages: profile.languages,
        price: profile.price,
        rating: profile.rating,
        totalRatings: profile.totalRatings,
        profileImage: profile.profileImage,
        isVerified: true
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update astrologer profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'astrologer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const isOnline = req.body.availability.online;

    // Update both AstrologerProfile and User documents
    const [profile] = await Promise.all([
      AstrologerProfile.findOneAndUpdate(
        { userId: req.user.id },
        { 
          ...req.body,
          status: {
            chat: isOnline,
            call: isOnline
          },
          updatedAt: new Date()
        },
        { new: true, upsert: true }
      ),
      User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        experience: req.body.experience,
        expertise: req.body.expertise,
        languages: req.body.languages,
        price: req.body.price,
        profileImage: req.body.profileImage,
        availability: {
          online: isOnline,
          startTime: req.body.availability.startTime,
          endTime: req.body.availability.endTime
        },
        status: {
          chat: isOnline,
          call: isOnline
        },
        isOnline: isOnline
      }, { new: true })
    ]);

    res.json({
      ...profile.toObject(),
      isOnline,
      status: {
        chat: isOnline,
        call: isOnline
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router; 