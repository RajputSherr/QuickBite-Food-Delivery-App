require('dotenv').config();
const mongoose = require('mongoose');

const ITEMS = [
  { name:'Spicy Dragon Burger',   category:'Burgers', price:12.99, rating:4.8, deliveryTime:'15-20', emoji:'🍔', description:'Double smash patty, ghost pepper sauce, crispy jalapeños, aged cheddar', isPopular:true,  isAvailable:true },
  { name:'Truffle Margherita',    category:'Pizza',   price:16.99, rating:4.9, deliveryTime:'20-25', emoji:'🍕', description:'San Marzano tomato, buffalo mozzarella, fresh basil, truffle oil drizzle', isPopular:true,  isAvailable:true },
  { name:'Wagyu Ramen',           category:'Asian',   price:19.99, rating:4.7, deliveryTime:'25-30', emoji:'🍜', description:'48-hr bone broth, wagyu beef, soft egg, bamboo shoots, nori', isPopular:false, isAvailable:true },
  { name:'Lobster Tacos',         category:'Mexican', price:22.99, rating:4.6, deliveryTime:'20-25', emoji:'🌮', description:'Butter-poached lobster, mango salsa, chipotle crema, micro cilantro', isPopular:false, isAvailable:true },
  { name:'Acai Power Bowl',       category:'Healthy', price:13.99, rating:4.5, deliveryTime:'10-15', emoji:'🥣', description:'Organic acai, granola, banana, blueberries, honey drizzle, chia seeds', isPopular:false, isAvailable:true },
  { name:'Crispy Korean Chicken', category:'Asian',   price:15.99, rating:4.8, deliveryTime:'20-25', emoji:'🍗', description:'Double-fried wings, gochujang glaze, sesame seeds, pickled daikon', isPopular:true,  isAvailable:true },
  { name:'Burrata Pasta',         category:'Italian', price:17.99, rating:4.7, deliveryTime:'20-25', emoji:'🍝', description:'Fresh pappardelle, slow-roasted tomatoes, creamy burrata, pine nuts', isPopular:false, isAvailable:true },
  { name:'Mango Sticky Rice',     category:'Desserts',price: 8.99, rating:4.9, deliveryTime:'5-10',  emoji:'🍨', description:'Sweet glutinous rice, fresh Alphonso mango, coconut cream, sesame', isPopular:true,  isAvailable:true },
  { name:'Classic Cheeseburger',  category:'Burgers', price:10.99, rating:4.6, deliveryTime:'15-20', emoji:'🍔', description:'Beef patty, American cheese, lettuce, tomato, pickles, special sauce', isPopular:false, isAvailable:true },
  { name:'BBQ Chicken Pizza',     category:'Pizza',   price:15.99, rating:4.5, deliveryTime:'20-25', emoji:'🍕', description:'Smoky BBQ base, grilled chicken, red onions, cilantro, mozzarella', isPopular:false, isAvailable:true },
  { name:'Pad Thai',              category:'Asian',   price:14.99, rating:4.6, deliveryTime:'20-25', emoji:'🍜', description:'Rice noodles, shrimp, tofu, egg, bean sprouts, tamarind, peanuts', isPopular:false, isAvailable:true },
  { name:'Churros & Chocolate',   category:'Desserts',price: 7.99, rating:4.8, deliveryTime:'5-10',  emoji:'🍩', description:'Crispy cinnamon churros with rich dark chocolate dipping sauce', isPopular:true,  isAvailable:true },
  { name:'Green Goddess Salad',   category:'Healthy', price:11.99, rating:4.4, deliveryTime:'10-15', emoji:'🥗', description:'Kale, avocado, cucumber, green goddess dressing, pumpkin seeds', isPopular:false, isAvailable:true },
  { name:'Beef Birria Tacos',     category:'Mexican', price:14.99, rating:4.7, deliveryTime:'20-25', emoji:'🌮', description:'Slow-braised beef, consommé, oaxacan cheese, cilantro, white onion', isPopular:true,  isAvailable:true },
  { name:'Tiramisu',              category:'Desserts',price: 9.99, rating:4.8, deliveryTime:'5-10',  emoji:'🍰', description:'Espresso-soaked ladyfingers, mascarpone cream, cocoa dusting', isPopular:false, isAvailable:true },
  { name:'Mango Lassi',           category:'Drinks',  price: 5.99, rating:4.7, deliveryTime:'5-10',  emoji:'🥤', description:'Fresh Alphonso mango, yogurt, cardamom, rose water, pistachios', isPopular:false, isAvailable:true },
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing in .env');
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    const schema = new mongoose.Schema({
      name:String, description:String, price:Number, category:String,
      emoji:String, rating:Number, deliveryTime:String,
      isPopular:Boolean, isAvailable:Boolean,
    }, { timestamps:true });

    const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', schema);
    await MenuItem.deleteMany({});
    const inserted = await MenuItem.insertMany(ITEMS);
    console.log(`✅ Seeded ${inserted.length} menu items:\n`);
    inserted.forEach(i => console.log(`   ${i.emoji}  ${i.name.padEnd(25)} $${i.price}`));
    console.log('\n🎉 Done! Refresh http://localhost:3000\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
