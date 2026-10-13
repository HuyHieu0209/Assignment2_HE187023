const mongoose = require('mongoose');

const loanItemSchema = new mongoose.Schema(
  {
    book_id: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Book',
    },
    bookId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Book',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: false }
);

const loanSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId(),
    },
    member_id: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Member',
      required: [true, 'Member is required'],
    },
    memberId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Member',
    },
    items: {
      type: [loanItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Loan must contain at least one book item',
      },
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['Borrowing', 'Returned', 'Overdue'],
        message: '{VALUE} is not a valid status. Permitted: Borrowing, Returned, Overdue',
      },
      default: 'Borrowing',
    },
  },
  {
    timestamps: true,
  }
);

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
