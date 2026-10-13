const express = require('express');
const router = express.Router();
const {
  getAllLoans,
  getLoanById,
  getLoansByMemberId,
  createLoan,
} = require('../controllers/loanController');

// Routes for /api/loans
router.route('/')
  .get(getAllLoans)
  .post(createLoan);

// Important: /member/:memberId must be defined before /:id to avoid route collision
router.route('/member/:memberId')
  .get(getLoansByMemberId);

router.route('/:id')
  .get(getLoanById);

module.exports = router;
