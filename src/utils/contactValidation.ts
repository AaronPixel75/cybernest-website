export type EnquiryType = 'project' | 'partnership' | 'academy';

export interface ContactFormPayload {
  enquiryType: EnquiryType;
  fullName: string;
  email: string;
  organization: string;
  message: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormPayload, string>>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContactForm(payload: ContactFormPayload): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormPayload, string>> = {};

  if (!payload.fullName.trim() || payload.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your name (at least 2 characters).';
  }

  if (!payload.email.trim() || !EMAIL_PATTERN.test(payload.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!payload.message.trim() || payload.message.trim().length < 12) {
    errors.message = 'Please share a brief description (at least 12 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
