const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/geeklet_store', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    phone: String,
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    isAdmin: { type: Boolean, default: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 }
    }]
}, { timestamps: true });

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    originalPrice: Number,
    discount: Number,
    category: String,
    brand: String,
    image: String,
    images: [String],
    stock: { type: Number, default: 0 },
    isNew: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isForYou: { type: Boolean, default: false },
    specifications: {
        color: String,
        ram: String,
        storage: String,
        processor: String,
        display: String
    },
    rating: { type: Number, default: 0 },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Order Schema
const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentMethod: String,
    paymentStatus: { type: String, default: 'pending' },
    orderStatus: { type: String, default: 'processing' },
    trackingNumber: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// AUTHENTICATION ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const updates = req.body;
        delete updates.password; // Don't allow password updates here
        
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            updates,
            { new: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PRODUCT ROUTES

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const { category, brand, search, sort, page = 1, limit = 12 } = req.query;
        const query = {};

        // Filters
        if (category) query.category = category;
        if (brand) query.brand = brand;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sorting
        let sortOption = {};
        if (sort === 'price-low') sortOption = { price: 1 };
        else if (sort === 'price-high') sortOption = { price: -1 };
        else if (sort === 'newest') sortOption = { createdAt: -1 };
        else sortOption = { createdAt: -1 };

        const products = await Product.find(query)
            .sort(sortOption)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('reviews.user', 'username');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get new arrivals
app.get('/api/products/filter/new', async (req, res) => {
    try {
        const products = await Product.find({ isNew: true }).limit(6);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get trending products
app.get('/api/products/filter/trending', async (req, res) => {
    try {
        const products = await Product.find({ isTrending: true }).limit(6);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get for you products
app.get('/api/products/filter/for-you', async (req, res) => {
    try {
        const products = await Product.find({ isForYou: true }).limit(8);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add product (Admin only)
app.post('/api/products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update product (Admin only)
app.put('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete product (Admin only)
app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CART ROUTES

// Get user cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('cart.product');
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const user = await User.findById(req.user.userId);

        const existingItem = user.cart.find(item => item.product.toString() === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({ product: productId, quantity });
        }

        await user.save();
        await user.populate('cart.product');
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update cart item
app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        const user = await User.findById(req.user.userId);

        const cartItem = user.cart.find(item => item.product.toString() === req.params.productId);
        if (!cartItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        cartItem.quantity = quantity;
        await user.save();
        await user.populate('cart.product');
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove from cart
app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.cart = user.cart.filter(item => item.product.toString() !== req.params.productId);
        await user.save();
        await user.populate('cart.product');
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Clear cart
app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.userId, { cart: [] });
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// WISHLIST ROUTES

// Get wishlist
app.get('/api/wishlist', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('wishlist');
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add to wishlist
app.post('/api/wishlist', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }

        await user.populate('wishlist');
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove from wishlist
app.delete('/api/wishlist/:productId', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
        await user.save();
        await user.populate('wishlist');
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ORDER ROUTES

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;
        
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }
            
            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;
            
            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price
            });
        }

        const order = new Order({
            user: req.user.userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentMethod
        });

        await order.save();
        await order.populate('items.product');

        // Clear user's cart
        await User.findByIdAndUpdate(req.user.userId, { cart: [] });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId })
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single order
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order or is admin
        if (order.user.toString() !== req.user.userId && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ADMIN ROUTES

// Get all orders (Admin only)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'username email')
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update order status (Admin only)
app.put('/api/admin/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { orderStatus, paymentStatus, trackingNumber } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus, paymentStatus, trackingNumber },
            { new: true }
        ).populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get dashboard stats (Admin only)
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Serve static files (your frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Handle React Router (if using React) or serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
