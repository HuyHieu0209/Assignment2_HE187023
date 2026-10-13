const mongoose = require('mongoose');
const Member = require('../models/Member');
const { PERMITTED_MEMBERSHIP_TYPES } = Member;

// Helper to normalize membershipType while checking permitted values
const getNormalizedMembershipType = (type) => {
  if (typeof type !== 'string') return null;
  const match = PERMITTED_MEMBERSHIP_TYPES.find(
    (permitted) => permitted.toLowerCase() === type.trim().toLowerCase()
  );
  return match || null;
};

// 1. Get all members - GET /api/members
const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    return res.status(200).json(members);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 2. Get member by ID - GET /api/members/:id
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    return res.status(200).json(member);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 3. Create a new member - POST /api/members
const createMember = async (req, res) => {
  try {
    const { name, fullName, email, membershipType, isActive, phone, address } = req.body;
    const memberName = name || fullName;

    // Validate required fields
    if (
      !memberName ||
      typeof memberName !== 'string' ||
      memberName.trim() === '' ||
      !email ||
      typeof email !== 'string' ||
      email.trim() === '' ||
      !membershipType ||
      typeof membershipType !== 'string' ||
      membershipType.trim() === ''
    ) {
      return res.status(400).json({
        message: 'All required fields must be provided: name (or fullName), email, membershipType',
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Restrict membershipType to permitted values
    const normalizedType = getNormalizedMembershipType(membershipType);
    if (!normalizedType) {
      return res.status(400).json({
        message: `Invalid membershipType. Permitted values are: ${PERMITTED_MEMBERSHIP_TYPES.join(', ')}`,
      });
    }

    // Ensure email is unique
    const existingMember = await Member.findOne({ email: email.trim().toLowerCase() });
    if (existingMember) {
      return res.status(400).json({ message: 'Email already exists. Email must be unique.' });
    }

    // Set isActive to true by default if not provided
    const memberIsActive = isActive !== undefined ? Boolean(isActive) : true;

    const newMember = await Member.create({
      name: memberName.trim(),
      fullName: memberName.trim(),
      email: email.trim().toLowerCase(),
      membershipType: normalizedType,
      isActive: memberIsActive,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
    });

    return res.status(201).json(newMember);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists. Email must be unique.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 4. Update a member - PUT /api/members/:id
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fullName, email, membershipType, isActive, phone, address } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const existingMember = await Member.findById(id);
    if (!existingMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const memberName = name !== undefined ? name : fullName;
    // Validate name if provided
    if (memberName !== undefined && (typeof memberName !== 'string' || memberName.trim() === '')) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    // Validate email if provided
    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ message: 'Email cannot be empty' });
      }
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }
      // Check email uniqueness
      const duplicateMember = await Member.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: id },
      });
      if (duplicateMember) {
        return res.status(400).json({ message: 'Email already exists. Email must be unique.' });
      }
    }

    // Validate membershipType if provided
    let normalizedType;
    if (membershipType !== undefined) {
      normalizedType = getNormalizedMembershipType(membershipType);
      if (!normalizedType) {
        return res.status(400).json({
          message: `Invalid membershipType. Permitted values are: ${PERMITTED_MEMBERSHIP_TYPES.join(', ')}`,
        });
      }
    }

    const updateData = {};
    if (memberName !== undefined) {
      updateData.name = memberName.trim();
      updateData.fullName = memberName.trim();
    }
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (membershipType !== undefined) updateData.membershipType = normalizedType;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();

    const updatedMember = await Member.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    return res.status(200).json(updatedMember);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists. Email must be unique.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 5. Delete a member - DELETE /api/members/:id
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const deletedMember = await Member.findByIdAndDelete(id);
    if (!deletedMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    return res.status(200).json({
      message: 'Member deleted successfully',
      member: deletedMember,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};
