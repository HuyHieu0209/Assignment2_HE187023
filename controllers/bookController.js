const mongoose = require('mongoose');
const Book = require('../models/Book');

// 1. Get all books - GET /api/books
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 2. Get book by ID - GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 3. Create a new book - POST /api/books
const createBook = async (req, res) => {
  try {
    const { title, author, isbn, copies, totalCopies, availableCopies, genre, category, publishedYear } = req.body;

    const rawCopies = copies !== undefined && copies !== null ? copies : totalCopies;

    if (
      !title ||
      typeof title !== 'string' ||
      title.trim() === '' ||
      !author ||
      typeof author !== 'string' ||
      author.trim() === '' ||
      !isbn ||
      typeof isbn !== 'string' ||
      isbn.trim() === '' ||
      rawCopies === undefined ||
      rawCopies === null ||
      rawCopies === ''
    ) {
      return res.status(400).json({
        message: 'All required fields must be provided: title, author, isbn, copies (or totalCopies)',
      });
    }

    const numericCopies = Number(rawCopies);
    if (isNaN(numericCopies)) {
      return res.status(400).json({ message: 'Copies must be a valid number' });
    }

    if (numericCopies < 0) {
      return res.status(400).json({ message: 'Number of book copies cannot be negative' });
    }

    const existingBook = await Book.findOne({ isbn: isbn.trim() });
    if (existingBook) {
      return res.status(400).json({ message: 'ISBN already exists. ISBN must be unique.' });
    }

    const bookCategory = category || genre;
    const newBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      copies: numericCopies,
      totalCopies: totalCopies !== undefined ? Number(totalCopies) : numericCopies,
      availableCopies: availableCopies !== undefined ? Number(availableCopies) : numericCopies,
      category: bookCategory ? bookCategory.trim() : undefined,
      genre: bookCategory ? bookCategory.trim() : undefined,
      publishedYear: publishedYear ? Number(publishedYear) : undefined,
    });

    return res.status(201).json(newBook);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'ISBN already exists. ISBN must be unique.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 4. Update a book - PUT /api/books/:id
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, copies, totalCopies, availableCopies, genre, category, publishedYear } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Validate copies if provided
    const rawCopies = copies !== undefined && copies !== null ? copies : totalCopies;
    if (rawCopies !== undefined && rawCopies !== null) {
      const numericCopies = Number(rawCopies);
      if (isNaN(numericCopies)) {
        return res.status(400).json({ message: 'Copies must be a valid number' });
      }
      if (numericCopies < 0) {
        return res.status(400).json({ message: 'Number of book copies cannot be negative' });
      }
    }

    if (availableCopies !== undefined && availableCopies !== null) {
      const numAvailable = Number(availableCopies);
      if (isNaN(numAvailable) || numAvailable < 0) {
        return res.status(400).json({ message: 'Available copies cannot be negative' });
      }
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }

    if (author !== undefined && (typeof author !== 'string' || author.trim() === '')) {
      return res.status(400).json({ message: 'Author cannot be empty' });
    }

    if (isbn !== undefined) {
      if (typeof isbn !== 'string' || isbn.trim() === '') {
        return res.status(400).json({ message: 'ISBN cannot be empty' });
      }
      const duplicateBook = await Book.findOne({
        isbn: isbn.trim(),
        _id: { $ne: id },
      });
      if (duplicateBook) {
        return res.status(400).json({ message: 'ISBN already exists. ISBN must be unique.' });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (author !== undefined) updateData.author = author.trim();
    if (isbn !== undefined) updateData.isbn = isbn.trim();
    if (rawCopies !== undefined && rawCopies !== null) {
      updateData.copies = Number(rawCopies);
      updateData.totalCopies = Number(rawCopies);
    }
    if (availableCopies !== undefined && availableCopies !== null) {
      updateData.availableCopies = Number(availableCopies);
    }
    const bookCategory = category || genre;
    if (bookCategory !== undefined) {
      updateData.category = bookCategory.trim();
      updateData.genre = bookCategory.trim();
    }
    if (publishedYear !== undefined) updateData.publishedYear = Number(publishedYear);

    const updatedBook = await Book.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    return res.status(200).json(updatedBook);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'ISBN already exists. ISBN must be unique.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 5. Delete a book - DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const deletedBook = await Book.findByIdAndDelete(id);
    if (!deletedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json({
      message: 'Book deleted successfully',
      book: deletedBook,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
