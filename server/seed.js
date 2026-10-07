const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const User = require('./src/models/User');
const ClientProfile = require('./src/models/ClientProfile');
const ProfessionalProfile = require('./src/models/ProfessionalProfile');
const Post = require('./src/models/Post');

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedDatabase = async () => {
  try {
    console.log('Clearing existing data (optional, skipping for now)...');
    // If you want to clear first, uncomment these:
    // await User.deleteMany();
    // await ClientProfile.deleteMany();
    // await ProfessionalProfile.deleteMany();
    // await Post.deleteMany();

    console.log('Creating users...');

    // 1. Create Clients
    const clientUsers = await User.insertMany([
      { name: 'John Client', email: 'john@client.com', password: 'password123', role: 'client', isVerified: true },
      { name: 'Sarah Client', email: 'sarah@client.com', password: 'password123', role: 'client', isVerified: true },
      { name: 'Mike Client', email: 'mike@client.com', password: 'password123', role: 'client', isVerified: true },
    ]);

    // 2. Create Trainers
    const trainerUsers = await User.insertMany([
      { name: 'Alex Trainer', email: 'alex@trainer.com', password: 'password123', role: 'trainer', isVerified: true },
      { name: 'Bella Trainer', email: 'bella@trainer.com', password: 'password123', role: 'trainer', isVerified: true },
      { name: 'Chris Trainer', email: 'chris@trainer.com', password: 'password123', role: 'trainer', isVerified: true },
    ]);

    // 3. Create Nutritionists
    const nutritionistUsers = await User.insertMany([
      { name: 'Diana Nutri', email: 'diana@nutri.com', password: 'password123', role: 'nutritionist', isVerified: true },
      { name: 'Evan Nutri', email: 'evan@nutri.com', password: 'password123', role: 'nutritionist', isVerified: true },
      { name: 'Fiona Nutri', email: 'fiona@nutri.com', password: 'password123', role: 'nutritionist', isVerified: true },
    ]);

    console.log('Creating profiles...');

    // 4. Create Client Profiles
    const clientProfiles = await ClientProfile.insertMany([
      { user: clientUsers[0]._id, age: 30, gender: 'male', heightCm: 180, weightKg: 85, fitnessGoals: ['weight-loss'], activityLevel: 'lightly-active', budgetMin: 50, budgetMax: 200, bio: 'Looking to lose some weight.' },
      { user: clientUsers[1]._id, age: 25, gender: 'female', heightCm: 165, weightKg: 60, fitnessGoals: ['muscle-gain'], activityLevel: 'moderately-active', budgetMin: 100, budgetMax: 300, bio: 'Want to build some muscle.' },
      { user: clientUsers[2]._id, age: 35, gender: 'male', heightCm: 175, weightKg: 75, fitnessGoals: ['endurance'], activityLevel: 'very-active', budgetMin: 80, budgetMax: 250, bio: 'Training for a marathon.' },
    ]);

    // 5. Create Professional Profiles (Trainers)
    const trainerProfiles = await ProfessionalProfile.insertMany([
      { user: trainerUsers[0]._id, specialty: ['Weightlifting', 'HIIT'], bio: 'Experienced weightlifting coach.', yearsExperience: 5, verificationStatus: 'approved', hourlyRate: 40 },
      { user: trainerUsers[1]._id, specialty: ['Yoga', 'Pilates'], bio: 'Certified Yoga instructor.', yearsExperience: 3, verificationStatus: 'approved', hourlyRate: 35 },
      { user: trainerUsers[2]._id, specialty: ['Crossfit', 'Strength'], bio: 'Crossfit enthusiast and coach.', yearsExperience: 7, verificationStatus: 'approved', hourlyRate: 50 },
    ]);

    // 6. Create Professional Profiles (Nutritionists)
    const nutritionistProfiles = await ProfessionalProfile.insertMany([
      { user: nutritionistUsers[0]._id, specialty: ['Vegan Diet', 'Weight Loss'], bio: 'Helping you transition to plant-based diets.', yearsExperience: 4, verificationStatus: 'approved', hourlyRate: 45 },
      { user: nutritionistUsers[1]._id, specialty: ['Sports Nutrition'], bio: 'Optimizing performance through nutrition.', yearsExperience: 6, verificationStatus: 'approved', hourlyRate: 60 },
      { user: nutritionistUsers[2]._id, specialty: ['Keto Diet', 'Diabetes Management'], bio: 'Specializing in low-carb diets.', yearsExperience: 8, verificationStatus: 'approved', hourlyRate: 55 },
    ]);

    console.log('Creating posts...');

    // 7. Create Posts
    const posts = await Post.insertMany([
      { client: clientUsers[0]._id, title: 'Need a trainer for weight loss', description: 'I want to lose 10kg in 3 months. Need someone to guide me.', tags: ['weight-loss', 'beginner'], needsTrainer: true, needsNutritionist: false, budgetMin: 100, budgetMax: 300, durationWeeks: 12 },
      { client: clientUsers[1]._id, title: 'Looking for a vegan nutritionist', description: 'I want to transition to a vegan diet but need a meal plan.', tags: ['vegan', 'meal-plan'], needsTrainer: false, needsNutritionist: true, budgetMin: 50, budgetMax: 150, durationWeeks: 4 },
      { client: clientUsers[2]._id, title: 'Marathon prep: need both trainer and nutritionist', description: 'Training for a marathon, need a specialized workout and meal plan.', tags: ['marathon', 'endurance'], needsTrainer: true, needsNutritionist: true, budgetMin: 200, budgetMax: 500, durationWeeks: 16 },
    ]);

    console.log('Database Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error('Error with data import', error);
    process.exit(1);
  }
};

seedDatabase();
