const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Member = require('../models/Member');
const Book = require('../models/Book');

// 1. Get all loans - GET /api/loans
const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('member_id')
      .populate('memberId')
      .populate('items.book_id')
      .populate('items.bookId')
      .sort({ createdAt: -1 });

    return res.status(200).json(loans);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 2. Get loan by ID - GET /api/loans/:id
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = await Loan.findById(id)
      .populate('member_id')
      .populate('memberId')
      .populate('items.book_id')
      .populate('items.bookId');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    return res.status(200).json(loan);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 3. Get borrowing records belonging to a specific member - GET /api/loans/member/:memberId
const getLoansByMemberId = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!mongoose.isValidObjectId(memberId)) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Verify member exists
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Find all loans belonging to this member
    const loans = await Loan.find({
      $or: [{ member_id: memberId }, { memberId: memberId }],
    })
      .populate('member_id')
      .populate('memberId')
      .populate('items.book_id')
      .populate('items.bookId')
      .sort({ createdAt: -1 });

    return res.status(200).json(loans);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 4. Create a new loan record - POST /api/loans
const createLoan = async (req, res) => {
  try {
    const targetMemberId = req.body.memberId || req.body.member_id;

    // Validate memberId is provided
    if (!targetMemberId) {
      return res.status(400).json({ message: 'memberId (or member_id) is required' });
    }

    if (!mongoose.isValidObjectId(targetMemberId)) {
      return res.status(400).json({ message: 'Invalid memberId format' });
    }

    // Check if member exists in database
    const member = await Member.findById(targetMemberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check if member is active
    if (member.isActive === false) {
      return res.status(400).json({
        message: 'Cannot create loan: Member is currently inactive',
      });
    }

    // Standardize items array
    let rawItems = req.body.items;
    if (!rawItems && (req.body.bookId || req.body.book_id)) {
      rawItems = [
        {
          bookId: req.body.bookId || req.body.book_id,
          quantity: req.body.quantity !== undefined ? req.body.quantity : 1,
        },
      ];
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({
        message: 'Loan must contain at least one book item in items array',
      });
    }

    // Validate each book item
    const formattedItems = [];
    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const bookId = item.bookId || item.book_id;

      if (!bookId) {
        return res.status(400).json({
          message: `Item at index ${i} is missing bookId (or book_id)`,
        });
      }

      if (!mongoose.isValidObjectId(bookId)) {
        return res.status(400).json({
          message: `Invalid bookId format at index ${i}`,
        });
      }

      const quantity = item.quantity !== undefined ? Number(item.quantity) : 1;
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          message: `Quantity for book ${bookId} must be a positive number (at least 1)`,
        });
      }

      // Check book existence
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({
          message: `Book not found with ID: ${bookId}`,
        });
      }

      // Check available copies if book tracks availability
      if (book.availableCopies !== undefined && book.availableCopies < quantity) {
        return res.status(400).json({
          message: `Not enough copies available for book "${book.title}". Available: ${book.availableCopies}, requested: ${quantity}`,
        });
      }

      formattedItems.push({
        book_id: bookId,
        bookId: bookId,
        quantity,
      });
    }

    // Validate dates
    const borrowDate = req.body.borrowDate ? new Date(req.body.borrowDate) : new Date();
    if (isNaN(borrowDate.getTime())) {
      return res.status(400).json({ message: 'Invalid borrowDate format' });
    }

    // Default dueDate: 14 days after borrowDate if not provided
    let dueDate;
    if (req.body.dueDate) {
      dueDate = new Date(req.body.dueDate);
      if (isNaN(dueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid dueDate format' });
      }
      if (dueDate <= borrowDate) {
        return res.status(400).json({ message: 'dueDate must be after borrowDate' });
      }
    } else {
      dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    // Create loan
    const newLoan = await Loan.create({
      member_id: targetMemberId,
      memberId: targetMemberId,
      items: formattedItems,
      borrowDate,
      dueDate,
      status: req.body.status || 'Borrowing',
    });

    // Deduct availableCopies for each borrowed book
    for (const item of formattedItems) {
      await Book.findByIdAndUpdate(item.book_id, {
        $inc: { availableCopies: -item.quantity },
      });
    }

    // Return fully populated loan record
    const populatedLoan = await Loan.findById(newLoan._id)
      .populate('member_id')
      .populate('memberId')
      .populate('items.book_id')
      .populate('items.bookId');

    return res.status(201).json(populatedLoan);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  getAllLoans,
  getLoanById,
  getLoansByMemberId,
  createLoan,
};
