export const required = (value) => (!value || !String(value).trim()) ? 'This field is required' : undefined;
export const email = (value) => value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email address' : undefined;
export const minLength = (min) => (value) => value && value.length < min ? `Minimum ${min} characters` : undefined;
export const maxLength = (max) => (value) => value && value.length > max ? `Maximum ${max} characters` : undefined;
export const phone = (value) => value && !/^[6-9]\d{9}$/.test(value) ? 'Invalid phone number' : undefined;
export const composeValidators = (...validators) => (value) => validators.reduce((error, validator) => error || validator(value), undefined);
