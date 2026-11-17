import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const AUTHOR_EMAIL = 'nikiledwin6@gmail.com';
export const AUTHOR_NAME = 'Nikil Varghese';

export const seedInitialData = async () => {
  try {
    const cleanEmail = AUTHOR_EMAIL.toLowerCase();

    // Ensure Author Account exists without overwriting any customized password or profile
    const existingAuthor = await User.findOne({ email: cleanEmail });
    if (!existingAuthor) {
      const passwordHash = await bcrypt.hash('Nikiledwin1', 12);
      await User.create({
        name: AUTHOR_NAME,
        email: cleanEmail,
        passwordHash,
        role: 'owner',
      });
      console.log(`👤 Author account initialized for ${AUTHOR_NAME} (${AUTHOR_EMAIL})`);
    }
  } catch (error) {
    console.error('❌ Error in seedInitialData:', error);
  }
};
