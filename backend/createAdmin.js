require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    const userSchema = new mongoose.Schema({
      name: String, email: String, password: String, role: String,
    });
    userSchema.pre('save', async function(next) {
      if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
      next();
    });
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const existing = await User.findOne({ email: 'admin@quickbite.com' });
    if (existing) {
      console.log('⚠️  Admin already exists!');
      console.log('📧 Email:    admin@quickbite.com');
      console.log('🔑 Password: Admin@123');
    } else {
      const admin = new User({ name: 'QuickBite Admin', email: 'admin@quickbite.com', password: 'Admin@123', role: 'admin' });
      await admin.save();
      console.log('✅ Admin account created!\n');
      console.log('📧 Email:    admin@quickbite.com');
      console.log('🔑 Password: Admin@123');
      console.log('\n⚠️  Change this password after first login!');
    }
    console.log('\n🎉 Done! Login at http://localhost:3000/admin');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
