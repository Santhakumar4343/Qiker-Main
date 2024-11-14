const {check, oneOf, validationResult } = require('express-validator');

function getSingleError(errors){
  return errors[0]['msg']; 
}

exports.login = [
  check('uemail', 'Invalid email').trim().notEmpty().isEmail(), 
  check('pwd', 'Password must be at least 4 characters long.').trim().notEmpty().isLength({min:4}),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({status: 0, message: getSingleError(errors.array()) });
    next();
  },
];

exports.register = [
  check('uname').trim().escape().not().isEmpty().withMessage('User name can not be empty!'),
  oneOf([
    check('uemail', 'Invalid email').trim().notEmpty().isEmail(), 
    check('mobile', 'Please enter valid mobile number.').trim().notEmpty().isMobilePhone()
  ],'Please enter valid Email OR Mobile number.'),
  check('pwd', 'Password must be at least 4 characters long.').trim().notEmpty().isLength({min:4}),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({status: 0, message: getSingleError(errors.array()) });
    next();
  },
];

exports.forgot_pass = [
  check('forgot_email', 'Invalid email').trim().notEmpty().isEmail(), 
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({status: 0, message: getSingleError(errors.array()) });
    next();
  },
];

exports.reset_pass = [
  check('reset_token', 'The reset token field is required.').trim().notEmpty(), 
  check('pwd', 'The password field is required.').trim().notEmpty().isLength({min:4}).withMessage('Password minimum 4 characters required!'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({status: 0, message: getSingleError(errors.array()) });
    next();
  },
];

exports.order_place = [
  check('user_id', 'The user id field is required.').trim().notEmpty(), 
  check('total_amount', 'The amount field is required.').trim().notEmpty(),
  check('shipping_address', 'The shipping address field is required.').trim().notEmpty(),
  check('billing_address', 'The billing address field is required.').trim().notEmpty(),
  check('payment_mode', 'The payment mode field is required.').trim().notEmpty(),
  check('payment_status', 'The payment status field is required.').trim().notEmpty(),
  check('products_details', 'The products detail field is required.').trim().notEmpty(), 
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({status: 0, message: getSingleError(errors.array()) });
    next();
  },
];