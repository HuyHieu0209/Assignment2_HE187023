const mongoose = require('mongoose');

const PERMITTED_MEMBERSHIP_TYPES = ['Student', 'Teacher', 'Guest'];

const memberSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId(),
    },
    name: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    membershipType: {
      type: String,
      required: [true, 'Membership type is required'],
      enum: {
        values: PERMITTED_MEMBERSHIP_TYPES,
        message: '{VALUE} is not a valid membership type. Permitted values: Student, Teacher, Guest',
      },
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
module.exports.PERMITTED_MEMBERSHIP_TYPES = PERMITTED_MEMBERSHIP_TYPES;
