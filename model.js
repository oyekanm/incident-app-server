const { default: mongoose } = require("mongoose");

const User = mongoose.model('User', {
    username: String,
    password: String,
  });
const Incident = mongoose.model('Incident', {
    title: String,
    description: String,
    category: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    imageUrl: String,
    userId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now },
  });

    
module.exports = {Incident,User}