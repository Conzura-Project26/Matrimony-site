// TypeScript-style enums for application-level type safety
// These match the CHECK constraints in the database

export const Gender = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other'
};

export const ProfileCreatedBy = {
  SELF: 'Self',
  PARENT: 'Parent',
  GUARDIAN: 'Guardian'
};

export const InterestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

// Validation helpers
export const isValidGender = (value) => Object.values(Gender).includes(value);
export const isValidProfileCreatedBy = (value) => Object.values(ProfileCreatedBy).includes(value);
export const isValidInterestStatus = (value) => Object.values(InterestStatus).includes(value);
