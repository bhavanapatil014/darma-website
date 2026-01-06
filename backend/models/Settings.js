const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Darma' },
    logoUrl: { type: String, default: '/images/logo.svg' },
    heroTitle: { type: String, default: 'Reveal Your Best Skin' },
    heroSubtitle: { type: String, default: 'Clinically proven dermatology solutions tailored to your unique skin profile.' },
    contactEmail: { type: String, default: 'support@darma.com' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
