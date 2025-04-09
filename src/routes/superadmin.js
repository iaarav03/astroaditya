const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Shop = require('../models/shop');
const { authenticateToken, hasRole, isSuperAdmin } = require('../middleware/auth');
const AstrologerProfile = require('../models/astrologer');
const Order = require('../models/order');

// Middleware to ensure user is superadmin
const ensureSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. SuperAdmin privileges required.' });
  }
};

// ===== STATISTICS =====
router.get('/stats', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalSuperadmins = await User.countDocuments({ role: 'superadmin' });
    
    const astrologers = await User.find({ role: 'astrologer' });
    const totalAstrologers = astrologers.length;
    const verifiedAstrologers = astrologers.filter(a => a.isVerified).length;
    const onlineAstrologers = astrologers.filter(a => a.availability?.online).length;
    const pendingVerifications = astrologers.filter(a => !a.isVerified).length;
    
    const products = await Shop.find();
    const totalProducts = products.length;
    
    const completedOrders = await Order.find({ 
      status: 'completed',
      paymentStatus: 'paid'
    });
    
    const totalOrders = completedOrders.length;
    const totalRevenue = completedOrders.reduce((acc, order) => acc + order.totalAmount, 0);
    
    const totalRatings = astrologers.reduce((acc, astrologer) => acc + (astrologer.rating || 0), 0);
    const averageRating = totalAstrologers > 0 ? totalRatings / totalAstrologers : 0;

    // Get revenue breakdown
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalSuperadmins,
      totalAstrologers,
      verifiedAstrologers,
      onlineAstrologers,
      pendingVerifications,
      totalProducts,
      totalOrders,
      totalRevenue,
      averageRating,
      monthlyRevenue,
      revenueBreakdown: {
        products: completedOrders.reduce((acc, order) => acc + order.totalAmount, 0),
        consultations: 0 
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ===== USER MANAGEMENT =====
router.get('/users', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.delete('/users/:userId', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check not deleting themselves or another superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete a superadmin account' });
    }
    
    await User.findByIdAndDelete(userId);
    
    // Also delete related data if necessary
    if (user.role === 'astrologer') {
      await AstrologerProfile.findOneAndDelete({ userId });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ===== ADMIN MANAGEMENT =====
router.get('/admins', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('-password');
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

router.post('/admins', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    
    // Create new admin
    const newAdmin = new User({
      name,
      email,
      password,
      role: role || 'admin',
      permissions: permissions || [],
      isActive: true
    });
    
    // Hash password and save
    await newAdmin.save();
    
    const adminData = { ...newAdmin.toObject() };
    delete adminData.password;
    
    res.status(201).json(adminData);
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

router.delete('/admins/:adminId', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Cannot delete superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete a superadmin account' });
    }
    
    await User.findByIdAndDelete(adminId);
    
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

router.put('/admins/:adminId/status', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { isActive } = req.body;
    
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Cannot modify superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot modify a superadmin account' });
    }
    
    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { isActive },
      { new: true }
    ).select('-password');
    
    res.json(updatedAdmin);
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ error: 'Failed to update admin status' });
  }
});

// ===== ASTROLOGER MANAGEMENT =====
router.get('/astrologers', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const astrologers = await User.find({ role: 'astrologer' }).select('-password');
    res.json(astrologers);
  } catch (error) {
    console.error('Error fetching astrologers:', error);
    res.status(500).json({ error: 'Failed to fetch astrologers' });
  }
});

// ===== SHOP MANAGEMENT =====
router.get('/shop', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const items = await Shop.find();
    res.json(items);
  } catch (error) {
    console.error('Error fetching shop items:', error);
    res.status(500).json({ error: 'Failed to fetch shop items' });
  }
});

router.delete('/shop/:itemId', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = await Shop.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Shop item not found' });
    }
    
    await Shop.findByIdAndDelete(itemId);
    
    res.json({ success: true, message: 'Shop item deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop item:', error);
    res.status(500).json({ error: 'Failed to delete shop item' });
  }
});

router.put('/shop/:itemId/featured', authenticateToken, hasRole(['superadmin']), async (req, res) => {
  try {
    const { itemId } = req.params;
    const { featured } = req.body;
    
    const item = await Shop.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Shop item not found' });
    }
    
    const updatedItem = await Shop.findByIdAndUpdate(
      itemId,
      { featured },
      { new: true }
    );
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating shop item:', error);
    res.status(500).json({ error: 'Failed to update shop item' });
  }
});

module.exports = router; 