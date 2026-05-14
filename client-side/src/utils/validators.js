/**
 * Validators — Form and input validation utilities.
 * 
 * Used with React Hook Form for consistent validation rules.
 */

/**
 * Email validation regex (RFC 5322 simplified).
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password must have: 8+ chars, 1 uppercase, 1 lowercase, 1 number.
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate password strength.
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain a number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * React Hook Form validation rules.
 */
export const formRules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: EMAIL_REGEX,
      message: 'Please enter a valid email address',
    },
  },

  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
    pattern: {
      value: PASSWORD_REGEX,
      message: 'Password must contain uppercase, lowercase, and a number',
    },
  },

  name: {
    required: 'Name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters',
    },
    maxLength: {
      value: 50,
      message: 'Name must be less than 50 characters',
    },
  },

  required: (fieldName) => ({
    required: `${fieldName} is required`,
  }),

  dateRange: {
    startDate: {
      required: 'Start date is required',
    },
    endDate: {
      required: 'End date is required',
    },
  },

  reason: {
    required: 'Reason is required',
    minLength: {
      value: 10,
      message: 'Please provide more detail (at least 10 characters)',
    },
    maxLength: {
      value: 500,
      message: 'Reason must be less than 500 characters',
    },
  },
};

/**
 * Sanitize user input to prevent XSS.
 * Strips HTML tags and trims whitespace.
 * @param {string} input
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>"'&]/g, (char) => {
      // Encode special characters
      const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
      return entities[char] || char;
    })
    .trim();
}
