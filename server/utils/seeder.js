const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const User = require('../models/User');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_inventory');
  console.log('MongoDB connected for seeding...');
};

const seedData = async () => {
  await connectDB();

  // Drop slug index if exists
  try { await mongoose.connection.db.collection('categories').dropIndex('slug_1'); } catch (e) {}

  // Clear all collections
  await User.deleteMany();
  await Category.deleteMany();
  await Supplier.deleteMany();
  await Product.deleteMany();
  await Customer.deleteMany();
  await Transaction.deleteMany();

  // ── USERS ──────────────────────────────────────────────
  const admin = await User.create({
    name: 'Jadav Hitakshi', email: 'jadavhitakshi@gmail.com',
    password: 'Admin@123456', role: 'admin', isEmailVerified: true,
  });
  const manager = await User.create({
    name: 'Nandani Soni', email: 'nandanisoni8686@gmail.com',
    password: 'Manager@123456', role: 'manager', isEmailVerified: true,
  });
  await User.create({ name: 'Rahul Sharma', email: 'rahulsharma@gmail.com', password: 'Staff@123456', role: 'staff', isEmailVerified: true });
  await User.create({ name: 'Priya Patel', email: 'priyapatel@gmail.com', password: 'Staff@123456', role: 'staff', isEmailVerified: true });
  await User.create({ name: 'Amit Verma', email: 'amitverma@gmail.com', password: 'Staff@123456', role: 'staff', isEmailVerified: true });
  await User.create({ name: 'Sneha Joshi', email: 'snehajoshi@gmail.com', password: 'Staff@123456', role: 'staff', isEmailVerified: true });
  await User.create({ name: 'Vikram Desai', email: 'vikramdesai@gmail.com', password: 'Staff@123456', role: 'viewer', isEmailVerified: true });
  console.log('✓ Users created');

  // ── CATEGORIES ─────────────────────────────────────────
  const catData = [
    { name: 'Electronics', description: 'Electronic devices and accessories', icon: 'cpu', color: '#6366f1', createdBy: admin._id },
    { name: 'Clothing', description: 'Apparel and fashion items', icon: 'shirt', color: '#ec4899', createdBy: admin._id },
    { name: 'Food & Beverages', description: 'Consumable food products', icon: 'coffee', color: '#10b981', createdBy: admin._id },
    { name: 'Office Supplies', description: 'Office and stationery items', icon: 'briefcase', color: '#f59e0b', createdBy: admin._id },
    { name: 'Tools & Hardware', description: 'Tools and hardware equipment', icon: 'tool', color: '#8b5cf6', createdBy: admin._id },
    { name: 'Health & Beauty', description: 'Health and personal care products', icon: 'heart', color: '#ef4444', createdBy: admin._id },
  ];
  const categories = [];
  for (const cat of catData) { categories.push(await Category.create(cat)); }
  console.log('✓ Categories created');

  // ── SUPPLIERS ──────────────────────────────────────────
  const supplierData = [
    { name: 'TechWorld Supplies', email: 'contact@techworld.com', phone: '+91-98765-43210', contactPerson: { name: 'Arjun Mehta', email: 'arjun@techworld.com', phone: '+91-98765-43211' }, address: { street: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', country: 'India', zipCode: '560001' }, paymentTerms: 'net30', rating: 5, createdBy: admin._id },
    { name: 'Fashion Hub India', email: 'orders@fashionhub.in', phone: '+91-87654-32109', contactPerson: { name: 'Kavya Reddy', email: 'kavya@fashionhub.in', phone: '+91-87654-32110' }, address: { street: '45 Linking Road', city: 'Mumbai', state: 'Maharashtra', country: 'India', zipCode: '400050' }, paymentTerms: 'net15', rating: 4, createdBy: admin._id },
    { name: 'Office Mart Distributors', email: 'sales@officemart.in', phone: '+91-76543-21098', contactPerson: { name: 'Suresh Kumar', email: 'suresh@officemart.in', phone: '+91-76543-21099' }, address: { street: '78 Connaught Place', city: 'New Delhi', state: 'Delhi', country: 'India', zipCode: '110001' }, paymentTerms: 'net45', rating: 4, createdBy: admin._id },
    { name: 'HealthCare Plus', email: 'info@healthcareplus.in', phone: '+91-65432-10987', contactPerson: { name: 'Dr. Meena Shah', email: 'meena@healthcareplus.in', phone: '+91-65432-10988' }, address: { street: '23 CG Road', city: 'Ahmedabad', state: 'Gujarat', country: 'India', zipCode: '380009' }, paymentTerms: 'net30', rating: 5, createdBy: admin._id },
  ];
  const suppliers = [];
  for (const sup of supplierData) { suppliers.push(await Supplier.create(sup)); }
  console.log('✓ Suppliers created');

  // ── PRODUCTS ───────────────────────────────────────────
  const productData = [
    { name: 'MacBook Pro 14"', sku: 'ELEC-001', description: 'Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD', price: { cost: 120000, selling: 149999 }, quantity: 45, reorderPoint: 10, maxStock: 100, category: categories[0]._id, supplier: suppliers[0]._id, tags: ['apple', 'laptop', 'premium'], createdBy: admin._id },
    { name: 'iPhone 15 Pro', sku: 'ELEC-002', description: 'Apple iPhone 15 Pro 256GB Titanium', price: { cost: 85000, selling: 109900 }, quantity: 8, reorderPoint: 15, maxStock: 80, category: categories[0]._id, supplier: suppliers[0]._id, tags: ['apple', 'smartphone'], createdBy: admin._id },
    { name: 'Samsung 4K Monitor 27"', sku: 'ELEC-003', description: 'Samsung 27" 4K UHD IPS Monitor', price: { cost: 28000, selling: 38999 }, quantity: 30, reorderPoint: 8, maxStock: 60, category: categories[0]._id, supplier: suppliers[0]._id, tags: ['samsung', 'monitor'], createdBy: admin._id },
    { name: 'Wireless Keyboard & Mouse', sku: 'ELEC-004', description: 'Logitech MK470 Slim Wireless Combo', price: { cost: 2800, selling: 4299 }, quantity: 5, reorderPoint: 20, maxStock: 100, category: categories[0]._id, supplier: suppliers[0]._id, tags: ['logitech', 'keyboard', 'mouse'], createdBy: admin._id },
    { name: 'Sony WH-1000XM5 Headphones', sku: 'ELEC-005', description: 'Sony Noise Cancelling Wireless Headphones', price: { cost: 22000, selling: 29990 }, quantity: 22, reorderPoint: 5, maxStock: 50, category: categories[0]._id, supplier: suppliers[0]._id, tags: ['sony', 'headphones', 'audio'], createdBy: admin._id },
    { name: "Men's Cotton Kurta", sku: 'CLTH-001', description: 'Premium cotton kurta for men, available in multiple colors', price: { cost: 450, selling: 999 }, quantity: 120, reorderPoint: 30, maxStock: 300, category: categories[1]._id, supplier: suppliers[1]._id, unit: 'piece', tags: ['kurta', 'ethnic', 'cotton'], createdBy: admin._id },
    { name: "Women's Salwar Suit", sku: 'CLTH-002', description: 'Designer salwar suit with dupatta', price: { cost: 800, selling: 1799 }, quantity: 85, reorderPoint: 25, maxStock: 200, category: categories[1]._id, supplier: suppliers[1]._id, unit: 'set', tags: ['salwar', 'ethnic', 'women'], createdBy: admin._id },
    { name: 'Sports Running Shoes', sku: 'CLTH-003', description: 'Nike Air Max running shoes for men and women', price: { cost: 3500, selling: 5999 }, quantity: 3, reorderPoint: 20, maxStock: 100, category: categories[1]._id, supplier: suppliers[1]._id, unit: 'piece', tags: ['nike', 'shoes', 'sports'], createdBy: admin._id },
    { name: 'A4 Paper Ream (500 sheets)', sku: 'OFFC-001', description: 'JK Copier A4 80 GSM paper ream', price: { cost: 220, selling: 380 }, quantity: 200, reorderPoint: 50, maxStock: 500, category: categories[3]._id, supplier: suppliers[2]._id, unit: 'pack', tags: ['paper', 'stationery'], createdBy: admin._id },
    { name: 'Ballpoint Pens Box (10 pcs)', sku: 'OFFC-002', description: 'Reynolds 045 Fine Carbure ballpoint pens', price: { cost: 45, selling: 90 }, quantity: 0, reorderPoint: 30, maxStock: 200, category: categories[3]._id, supplier: suppliers[2]._id, unit: 'box', tags: ['pen', 'stationery'], createdBy: admin._id },
    { name: 'Heavy Duty Stapler', sku: 'OFFC-003', description: 'Kangaro HD-45L heavy duty stapler', price: { cost: 350, selling: 650 }, quantity: 40, reorderPoint: 10, maxStock: 80, category: categories[3]._id, supplier: suppliers[2]._id, tags: ['stapler', 'office'], createdBy: admin._id },
    { name: 'Vitamin C Tablets (60 tabs)', sku: 'HLTH-001', description: 'Himalaya Vitamin C 500mg tablets', price: { cost: 180, selling: 320 }, quantity: 150, reorderPoint: 40, maxStock: 400, category: categories[5]._id, supplier: suppliers[3]._id, unit: 'pack', tags: ['vitamin', 'health', 'supplement'], createdBy: admin._id },
    { name: 'Hand Sanitizer 500ml', sku: 'HLTH-002', description: 'Dettol Original Hand Sanitizer 500ml', price: { cost: 120, selling: 220 }, quantity: 7, reorderPoint: 25, maxStock: 200, category: categories[5]._id, supplier: suppliers[3]._id, unit: 'liter', tags: ['sanitizer', 'hygiene'], createdBy: admin._id },
  ];
  const products = [];
  for (const p of productData) { products.push(await Product.create(p)); }
  console.log('✓ Products created');

  // ── CUSTOMERS ──────────────────────────────────────────
  const customerData = [
    { fullName: 'Ramesh Kumar Gupta', phone: '+91-98765-11111', phone2: '+91-98765-11112', email: 'ramesh.gupta@gmail.com', address: '12 Shivaji Nagar', address2: 'Near Bus Stand', city: 'Pune', district: 'Pune', state: 'Maharashtra', pincode: '411005', status: 'active', totalPurchases: 5, totalSpent: 45000, createdBy: admin._id },
    { fullName: 'Sunita Devi Sharma', phone: '+91-87654-22222', email: 'sunita.sharma@gmail.com', address: '45 Gandhi Road', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', pincode: '302001', status: 'active', totalPurchases: 3, totalSpent: 12500, createdBy: admin._id },
    { fullName: 'Mohan Lal Agarwal', phone: '+91-76543-33333', phone2: '+91-76543-33334', email: 'mohan.agarwal@yahoo.com', address: '78 MG Road', city: 'Indore', district: 'Indore', state: 'Madhya Pradesh', pincode: '452001', status: 'active', totalPurchases: 8, totalSpent: 89000, createdBy: manager._id },
    { fullName: 'Priya Kumari Singh', phone: '+91-65432-44444', email: 'priya.singh@gmail.com', address: '23 Ashok Nagar', city: 'Patna', district: 'Patna', state: 'Bihar', pincode: '800001', status: 'active', totalPurchases: 2, totalSpent: 8500, createdBy: manager._id },
    { fullName: 'Vijay Shankar Rao', phone: '+91-54321-55555', email: 'vijay.rao@gmail.com', address: '56 Banjara Hills', city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', pincode: '500034', status: 'active', totalPurchases: 12, totalSpent: 156000, createdBy: admin._id },
    { fullName: 'Anita Krishnamurthy', phone: '+91-43210-66666', email: 'anita.k@gmail.com', address: '89 Koramangala', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560034', status: 'active', totalPurchases: 6, totalSpent: 67500, createdBy: admin._id },
    { fullName: 'Deepak Choudhary', phone: '+91-32109-77777', email: 'deepak.c@gmail.com', address: '34 Sector 15', city: 'Chandigarh', district: 'Chandigarh', state: 'Punjab', pincode: '160015', status: 'inactive', totalPurchases: 1, totalSpent: 3200, createdBy: manager._id },
    { fullName: 'Kavitha Nair', phone: '+91-21098-88888', email: 'kavitha.nair@gmail.com', address: '67 MG Road', city: 'Kochi', district: 'Ernakulam', state: 'Kerala', pincode: '682001', status: 'active', totalPurchases: 4, totalSpent: 28000, createdBy: admin._id },
  ];
  for (const c of customerData) { await Customer.create(c); }
  console.log('✓ Customers created');

  // ── TRANSACTIONS ───────────────────────────────────────
  // Create transactions spread over the last 90 days for chart data
  const now = Date.now();
  const daysAgo = (d) => new Date(now - d * 24 * 60 * 60 * 1000);

  const txData = [
    // Sales spread over last 90 days
    { type: 'sale', status: 'completed', paymentMethod: 'card', createdAt: daysAgo(85), completedAt: daysAgo(85), customer: { name: 'Vijay Shankar Rao', email: 'vijay.rao@gmail.com', phone: '+91-54321-55555' }, items: [{ product: products[0]._id, quantity: 1, unitPrice: 149999, totalPrice: 149999 }], discount: 5000, tax: 26280, netAmount: 171279, totalAmount: 149999, createdBy: admin._id },
    { type: 'sale', status: 'completed', paymentMethod: 'online', createdAt: daysAgo(72), completedAt: daysAgo(72), customer: { name: 'Anita Krishnamurthy', email: 'anita.k@gmail.com', phone: '+91-43210-66666' }, items: [{ product: products[1]._id, quantity: 1, unitPrice: 109900, totalPrice: 109900 }, { product: products[4]._id, quantity: 1, unitPrice: 29990, totalPrice: 29990 }], discount: 3000, tax: 24282, netAmount: 161172, totalAmount: 139890, createdBy: manager._id },
    { type: 'purchase', status: 'completed', paymentMethod: 'bank_transfer', createdAt: daysAgo(65), completedAt: daysAgo(65), supplier: suppliers[0]._id, items: [{ product: products[3]._id, quantity: 50, unitPrice: 2800, totalPrice: 140000 }], discount: 0, tax: 25200, netAmount: 165200, totalAmount: 140000, createdBy: admin._id },
    { type: 'sale', status: 'completed', paymentMethod: 'cash', createdAt: daysAgo(58), completedAt: daysAgo(58), customer: { name: 'Mohan Lal Agarwal', email: 'mohan.agarwal@yahoo.com', phone: '+91-76543-33333' }, items: [{ product: products[5]._id, quantity: 5, unitPrice: 999, totalPrice: 4995 }, { product: products[6]._id, quantity: 3, unitPrice: 1799, totalPrice: 5397 }], discount: 500, tax: 1782, netAmount: 11674, totalAmount: 10392, createdBy: manager._id },
    { type: 'sale', status: 'completed', paymentMethod: 'card', createdAt: daysAgo(45), completedAt: daysAgo(45), customer: { name: 'Kavitha Nair', email: 'kavitha.nair@gmail.com', phone: '+91-21098-88888' }, items: [{ product: products[2]._id, quantity: 1, unitPrice: 38999, totalPrice: 38999 }], discount: 1000, tax: 6840, netAmount: 44839, totalAmount: 38999, createdBy: admin._id },
    { type: 'purchase', status: 'completed', paymentMethod: 'bank_transfer', createdAt: daysAgo(38), completedAt: daysAgo(38), supplier: suppliers[1]._id, items: [{ product: products[5]._id, quantity: 100, unitPrice: 450, totalPrice: 45000 }, { product: products[6]._id, quantity: 60, unitPrice: 800, totalPrice: 48000 }], discount: 2000, tax: 16380, netAmount: 107380, totalAmount: 93000, createdBy: admin._id },
    { type: 'sale', status: 'completed', paymentMethod: 'online', createdAt: daysAgo(30), completedAt: daysAgo(30), customer: { name: 'Sunita Devi Sharma', email: 'sunita.sharma@gmail.com', phone: '+91-87654-22222' }, items: [{ product: products[11]._id, quantity: 3, unitPrice: 320, totalPrice: 960 }, { product: products[12]._id, quantity: 2, unitPrice: 220, totalPrice: 440 }], discount: 50, tax: 243, netAmount: 1593, totalAmount: 1400, createdBy: manager._id },
    { type: 'sale', status: 'completed', paymentMethod: 'cash', createdAt: daysAgo(22), completedAt: daysAgo(22), customer: { name: 'Ramesh Kumar Gupta', email: 'ramesh.gupta@gmail.com', phone: '+91-98765-11111' }, items: [{ product: products[4]._id, quantity: 1, unitPrice: 29990, totalPrice: 29990 }], discount: 500, tax: 5310, netAmount: 34800, totalAmount: 29990, createdBy: admin._id },
    { type: 'sale', status: 'completed', paymentMethod: 'card', createdAt: daysAgo(15), completedAt: daysAgo(15), customer: { name: 'Priya Kumari Singh', email: 'priya.singh@gmail.com', phone: '+91-65432-44444' }, items: [{ product: products[7]._id, quantity: 10, unitPrice: 380, totalPrice: 3800 }, { product: products[10]._id, quantity: 5, unitPrice: 650, totalPrice: 3250 }], discount: 200, tax: 1269, netAmount: 8119, totalAmount: 7050, createdBy: manager._id },
    { type: 'purchase', status: 'completed', paymentMethod: 'bank_transfer', createdAt: daysAgo(10), completedAt: daysAgo(10), supplier: suppliers[2]._id, items: [{ product: products[7]._id, quantity: 200, unitPrice: 220, totalPrice: 44000 }, { product: products[9]._id, quantity: 100, unitPrice: 45, totalPrice: 4500 }], discount: 0, tax: 8730, netAmount: 57230, totalAmount: 48500, createdBy: admin._id },
    { type: 'sale', status: 'completed', paymentMethod: 'online', createdAt: daysAgo(6), completedAt: daysAgo(6), customer: { name: 'Vijay Shankar Rao', email: 'vijay.rao@gmail.com', phone: '+91-54321-55555' }, items: [{ product: products[0]._id, quantity: 1, unitPrice: 149999, totalPrice: 149999 }], discount: 5000, tax: 26280, netAmount: 171279, totalAmount: 149999, createdBy: admin._id },
    { type: 'sale', status: 'completed', paymentMethod: 'cash', createdAt: daysAgo(3), completedAt: daysAgo(3), customer: { name: 'Anita Krishnamurthy', email: 'anita.k@gmail.com', phone: '+91-43210-66666' }, items: [{ product: products[3]._id, quantity: 2, unitPrice: 4299, totalPrice: 8598 }], discount: 200, tax: 1512, netAmount: 9910, totalAmount: 8598, createdBy: manager._id },
    { type: 'sale', status: 'pending', paymentMethod: 'card', createdAt: daysAgo(1), customer: { name: 'Mohan Lal Agarwal', email: 'mohan.agarwal@yahoo.com', phone: '+91-76543-33333' }, items: [{ product: products[2]._id, quantity: 1, unitPrice: 38999, totalPrice: 38999 }], discount: 1000, tax: 6840, netAmount: 44839, totalAmount: 38999, createdBy: admin._id },
  ];

  for (const tx of txData) {
    await Transaction.create(tx);
  }
  console.log('✓ Transactions created');

  console.log('\n✅ Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Admin:   jadavhitakshi@gmail.com   / Admin@123456');
  console.log('👔 Manager: nandanisoni8686@gmail.com / Manager@123456');
  console.log('👷 Staff:   rahulsharma@gmail.com     / Staff@123456');
  console.log('👷 Staff:   priyapatel@gmail.com      / Staff@123456');
  console.log('👷 Staff:   amitverma@gmail.com       / Staff@123456');
  console.log('👷 Staff:   snehajoshi@gmail.com      / Staff@123456');
  console.log('👁️  Viewer:  vikramdesai@gmail.com     / Staff@123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 Products: ${productData.length} | 🏷️ Categories: ${catData.length} | 🚚 Suppliers: ${supplierData.length}`);
  console.log(`👥 Customers: ${customerData.length} | 💰 Transactions: ${txData.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
