const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  avatar: { 
    type: String, 
    default: "avatar-default.jpg" 
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [6, "Password must be greater than 6 characters"],
  },
  role: {
    type: String,
    enum: ["admin", "qam", "qac", "staff"],
    default: "staff",
  },
  department: {
    type: String,
    default: null,
  },
  viewIdeas: [
    {
      idea_id: { type: Schema.Types.ObjectId },
      isLike: Boolean,
      isDislike: Boolean,
    },
  ],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});


module.exports = mongoose.model("user", UserSchema);
