const { body } = require('express-validator');

exports.validateRegistration = [
  body('name')
    .isLength({ min: 20, max: 60 }).withMessage('Name must be between 20 and 60 characters'),
  body('email')
    .isEmail().withMessage('Invalid email address'),
  body('password')
    .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .isLength({ min: 8, max: 16 }).withMessage('Password must be 8-16 characters with at least one uppercase letter and one special character'),
  body('address')
    .isLength({ max: 400 }).withMessage('Address must not exceed 400 characters')
];
