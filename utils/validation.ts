// Validation utility functions for the Skye weather app

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validate coordinates
export const validateCoordinates = (latitude: number, longitude: number): ValidationResult => {
  const errors: string[] = [];

  if (typeof latitude !== 'number' || isNaN(latitude)) {
    errors.push('Latitude must be a valid number');
  } else if (latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }

  if (typeof longitude !== 'number' || isNaN(longitude)) {
    errors.push('Longitude must be a valid number');
  } else if (longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate temperature values
export const validateTemperature = (temp: any): ValidationResult => {
  const errors: string[] = [];

  if (typeof temp !== 'number' || isNaN(temp)) {
    errors.push('Temperature must be a valid number');
  } else if (temp < -100 || temp > 150) {
    errors.push('Temperature must be between -100 and 150 degrees');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate string values
export const validateString = (value: any, fieldName: string, required: boolean = true): ValidationResult => {
  const errors: string[] = [];

  if (required && (!value || typeof value !== 'string' || value.trim().length === 0)) {
    errors.push(`${fieldName} is required and must be a non-empty string`);
  } else if (value && typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate array values
export const validateArray = (value: any, fieldName: string, required: boolean = true): ValidationResult => {
  const errors: string[] = [];

  if (required && (!Array.isArray(value) || value.length === 0)) {
    errors.push(`${fieldName} is required and must be a non-empty array`);
  } else if (value && !Array.isArray(value)) {
    errors.push(`${fieldName} must be an array`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate object values
export const validateObject = (value: any, fieldName: string, required: boolean = true): ValidationResult => {
  const errors: string[] = [];

  if (required && (!value || typeof value !== 'object' || Array.isArray(value))) {
    errors.push(`${fieldName} is required and must be a valid object`);
  } else if (value && (typeof value !== 'object' || Array.isArray(value))) {
    errors.push(`${fieldName} must be an object`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate API response structure
export const validateApiResponse = (response: any, requiredFields: string[]): ValidationResult => {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    errors.push('API response must be a valid object');
    return { isValid: false, errors };
  }

  for (const field of requiredFields) {
    if (!(field in response)) {
      errors.push(`API response missing required field: ${field}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Safe data access functions
export const getSafeNumber = (value: any, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  return fallback;
};

export const getSafeInteger = (value: any, fallback: number = 0): number => {
  const num = getSafeNumber(value, fallback);
  return Math.round(num);
};

export const getSafeString = (value: any, fallback: string = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

export const getSafeArray = (value: any): any[] => {
  return Array.isArray(value) ? value : [];
};

export const getSafeObject = (value: any): Record<string, any> => {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};

// Validate weather data structure
export const validateWeatherData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Check if data exists and is an object
  const objectValidation = validateObject(data, 'weather data');
  if (!objectValidation.isValid) {
    errors.push(...objectValidation.errors);
    return { isValid: false, errors };
  }

  // Check required top-level fields
  const requiredFields = ['current', 'hourly', 'daily', 'location', 'lastUpdated'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Weather data missing required field: ${field}`);
    }
  }

  // Validate current weather if it exists
  if (data.current) {
    const currentRequired = ['temp', 'feels_like', 'humidity', 'wind_speed', 'description', 'icon', 'precipitation'];
    for (const field of currentRequired) {
      if (!(field in data.current)) {
        errors.push(`Current weather missing required field: ${field}`);
      }
    }
  }

  // Validate arrays
  if (!Array.isArray(data.hourly)) {
    errors.push('Hourly forecast must be an array');
  }
  if (!Array.isArray(data.daily)) {
    errors.push('Daily forecast must be an array');
  }

  // Validate location
  if (data.location) {
    if (!data.location.city || !data.location.country) {
      errors.push('Location must have both city and country');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate location data structure
export const validateLocationData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Check if data exists and is an object
  const objectValidation = validateObject(data, 'location data');
  if (!objectValidation.isValid) {
    errors.push(...objectValidation.errors);
    return { isValid: false, errors };
  }

  // Validate coordinates
  const coordValidation = validateCoordinates(data.latitude, data.longitude);
  if (!coordValidation.isValid) {
    errors.push(...coordValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Sanitize and validate user input
export const sanitizeUserInput = (input: any, maxLength: number = 100): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters and limit length
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, maxLength);
};

// Validate search query
export const validateSearchQuery = (query: any): ValidationResult => {
  const errors: string[] = [];

  if (!query || typeof query !== 'string') {
    errors.push('Search query must be a string');
  } else if (query.trim().length === 0) {
    errors.push('Search query cannot be empty');
  } else if (query.trim().length < 2) {
    errors.push('Search query must be at least 2 characters long');
  } else if (query.length > 50) {
    errors.push('Search query cannot exceed 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}; 