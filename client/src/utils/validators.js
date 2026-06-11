import * as yup from 'yup';

// ── Auth Schemas ─────────────────────────────────────────────────────────
export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Full name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password'),
});

// ── Product Schema ───────────────────────────────────────────────────────
export const productSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(100, 'Product name cannot exceed 100 characters')
    .required('Product name is required'),
  sku: yup
    .string()
    .matches(/^[A-Z0-9-_]+$/i, 'SKU can only contain letters, numbers, hyphens and underscores')
    .min(3, 'SKU must be at least 3 characters')
    .required('SKU is required'),
  category: yup.string().required('Please select a category'),
  'price.cost': yup
    .number()
    .typeError('Cost price must be a number')
    .min(0, 'Cost price cannot be negative')
    .required('Cost price is required'),
  'price.selling': yup
    .number()
    .typeError('Selling price must be a number')
    .min(0, 'Selling price cannot be negative')
    .required('Selling price is required'),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .min(0, 'Quantity cannot be negative')
    .integer('Quantity must be a whole number')
    .required('Quantity is required'),
  reorderPoint: yup
    .number()
    .typeError('Reorder point must be a number')
    .min(0, 'Reorder point cannot be negative')
    .integer('Must be a whole number'),
});

// ── Category Schema ──────────────────────────────────────────────────────
export const categorySchema = yup.object({
  name: yup
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name cannot exceed 50 characters')
    .required('Category name is required'),
  description: yup.string().max(200, 'Description cannot exceed 200 characters'),
  color: yup
    .string()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color')
    .required('Color is required'),
});

// ── Supplier Schema ──────────────────────────────────────────────────────
export const supplierSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Supplier name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .required('Supplier name is required'),
  email: yup.string().email('Please enter a valid email address'),
  phone: yup
    .string()
    .matches(/^[+]?[0-9\s-()]{7,15}$/, 'Please enter a valid phone number'),
  paymentTerms: yup.string().required('Payment terms are required'),
  rating: yup
    .number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
});

// ── Customer Schema ──────────────────────────────────────────────────────
export const customerSchema = yup.object({
  fullName: yup
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .required('Full name is required'),
  phone: yup
    .string()
    .matches(/^[+]?[0-9\s-()]{7,15}$/, 'Please enter a valid phone number')
    .required('Phone number is required'),
  phone2: yup
    .string()
    .matches(/^[+]?[0-9\s-()]{7,15}$/, 'Please enter a valid phone number')
    .nullable()
    .transform((v) => v === '' ? null : v),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .nullable()
    .transform((v) => v === '' ? null : v),
  address: yup
    .string()
    .min(5, 'Address must be at least 5 characters')
    .required('Address is required'),
  pincode: yup
    .string()
    .matches(/^[0-9]{6}$/, 'PIN code must be exactly 6 digits')
    .nullable()
    .transform((v) => v === '' ? null : v),
});

// ── User Schema ──────────────────────────────────────────────────────────
export const userSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string().when('$isEdit', {
    is: false,
    then: (s) => s.min(8, 'Password must be at least 8 characters').required('Password is required'),
    otherwise: (s) => s.optional(),
  }),
  role: yup.string().oneOf(['admin', 'manager', 'staff', 'viewer']).required('Role is required'),
});
