const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId(),
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    totalCopies: {
      type: Number,
      min: [0, 'Number of book copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      min: [0, 'Number of book copies cannot be negative'],
    },
    copies: {
      type: Number,
      min: [0, 'Number of book copies cannot be negative'],
    },
    category: {
      type: String,
      trim: true,
    },
    genre: {
      type: String,
      trim: true,
    },
    publishedYear: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
