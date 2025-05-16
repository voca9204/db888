import { DbColumn } from '../../types/store';

/**
 * Types of database fields for validation purposes
 */
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
  OTHER = 'other'
}

/**
 * Determines the field type based on the MariaDB column type
 * @param columnType The MariaDB column type (e.g., 'varchar(255)', 'int(11)')
 */
export const getFieldType = (columnType: string): FieldType => {
  const lowerType = columnType.toLowerCase();
  
  // String types
  if (
    lowerType.includes('char') ||
    lowerType.includes('text') ||
    lowerType.includes('blob')
  ) {
    return FieldType.STRING;
  }
  
  // Number types
  if (
    lowerType.includes('int') ||
    lowerType.includes('decimal') ||
    lowerType.includes('numeric') ||
    lowerType.includes('float') ||
    lowerType.includes('double') ||
    lowerType.includes('real')
  ) {
    return FieldType.NUMBER;
  }
  
  // Date types
  if (lowerType === 'date') {
    return FieldType.DATE;
  }
  
  // DateTime types
  if (
    lowerType.includes('datetime') ||
    lowerType.includes('timestamp') ||
    lowerType === 'time'
  ) {
    return FieldType.DATETIME;
  }
  
  // Boolean types
  if (
    lowerType === 'boolean' ||
    lowerType === 'bool' ||
    lowerType === 'bit(1)'
  ) {
    return FieldType.BOOLEAN;
  }
  
  // Enum types
  if (lowerType.includes('enum')) {
    return FieldType.ENUM;
  }
  
  // Default to other
  return FieldType.OTHER;
};

/**
 * Extracts enum values from a MariaDB enum type definition
 * @param enumType The enum type definition (e.g., "enum('value1','value2')")
 */
export const extractEnumValues = (enumType: string): string[] => {
  const match = enumType.match(/enum\('(.*)'\)/i);
  if (!match || !match[1]) return [];
  
  // Split by commas but handle escaped quotes correctly
  const values = match[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/);
  
  // Remove the quotes
  return values.map(v => v.replace(/^'|'$/g, ''));
};

/**
 * Validates if a value matches the expected field type
 * @param value The value to validate
 * @param column The database column definition
 */
export const validateFieldValue = (
  value: any,
  column: DbColumn
): { isValid: boolean; error?: string } => {
  // Handle null values
  if (value === null || value === undefined || value === '') {
    if (column.nullable) {
      return { isValid: true };
    } else {
      return { isValid: false, error: `${column.name} cannot be null` };
    }
  }
  
  const fieldType = getFieldType(column.type);
  
  switch (fieldType) {
    case FieldType.NUMBER:
      return validateNumber(value, column);
    case FieldType.DATE:
    case FieldType.DATETIME:
      return validateDate(value, column, fieldType);
    case FieldType.BOOLEAN:
      return validateBoolean(value);
    case FieldType.ENUM:
      return validateEnum(value, column);
    case FieldType.STRING:
    default:
      return validateString(value, column);
  }
};

/**
 * Validates a number field
 */
const validateNumber = (
  value: any,
  column: DbColumn
): { isValid: boolean; error?: string } => {
  // Try to convert to number
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: `${column.name} must be a valid number`
    };
  }
  
  // Check for integer types
  if (
    column.type.toLowerCase().includes('int') &&
    !Number.isInteger(numValue)
  ) {
    return {
      isValid: false,
      error: `${column.name} must be an integer`
    };
  }
  
  return { isValid: true };
};

/**
 * Validates a string field
 */
const validateString = (
  value: any,
  column: DbColumn
): { isValid: boolean; error?: string } => {
  const strValue = String(value);
  
  // Extract max length from type like 'varchar(255)'
  const lengthMatch = column.type.match(/\((\d+)\)/);
  if (lengthMatch && lengthMatch[1]) {
    const maxLength = parseInt(lengthMatch[1], 10);
    if (strValue.length > maxLength) {
      return {
        isValid: false,
        error: `${column.name} cannot exceed ${maxLength} characters`
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Validates a date or datetime field
 */
const validateDate = (
  value: any,
  column: DbColumn,
  fieldType: FieldType
): { isValid: boolean; error?: string } => {
  // Accept Date objects
  if (value instanceof Date && !isNaN(value.getTime())) {
    return { isValid: true };
  }
  
  // Try to parse the date
  const dateValue = new Date(value);
  if (isNaN(dateValue.getTime())) {
    return {
      isValid: false,
      error: `${column.name} must be a valid ${
        fieldType === FieldType.DATE ? 'date' : 'datetime'
      }`
    };
  }
  
  return { isValid: true };
};

/**
 * Validates a boolean field
 */
const validateBoolean = (
  value: any
): { isValid: boolean; error?: string } => {
  // Accept boolean values
  if (typeof value === 'boolean') {
    return { isValid: true };
  }
  
  // Accept numeric 0/1
  if (value === 0 || value === 1 || value === '0' || value === '1') {
    return { isValid: true };
  }
  
  // Accept string 'true'/'false'
  if (
    value.toString().toLowerCase() === 'true' ||
    value.toString().toLowerCase() === 'false'
  ) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: 'Value must be a boolean (true/false or 0/1)'
  };
};

/**
 * Validates an enum field
 */
const validateEnum = (
  value: any,
  column: DbColumn
): { isValid: boolean; error?: string } => {
  const strValue = String(value);
  const enumValues = extractEnumValues(column.type);
  
  if (!enumValues.includes(strValue)) {
    return {
      isValid: false,
      error: `${column.name} must be one of: ${enumValues.join(', ')}`
    };
  }
  
  return { isValid: true };
};

/**
 * Formats a value for SQL based on its field type
 * @param value The value to format
 * @param column The database column definition
 */
export const formatValueForField = (
  value: any,
  column: DbColumn
): string => {
  // Handle null values
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }
  
  const fieldType = getFieldType(column.type);
  
  switch (fieldType) {
    case FieldType.NUMBER:
      return String(Number(value));
    case FieldType.DATE:
      if (value instanceof Date) {
        return `'${value.toISOString().split('T')[0]}'`;
      } else {
        const dateValue = new Date(value);
        return `'${dateValue.toISOString().split('T')[0]}'`;
      }
    case FieldType.DATETIME:
      if (value instanceof Date) {
        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
      } else {
        const dateValue = new Date(value);
        return `'${dateValue.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
    case FieldType.BOOLEAN:
      if (typeof value === 'boolean') {
        return value ? '1' : '0';
      }
      if (value === 1 || value === 0 || value === '1' || value === '0') {
        return String(value);
      }
      return value.toString().toLowerCase() === 'true' ? '1' : '0';
    case FieldType.STRING:
    case FieldType.ENUM:
    default:
      // Escape single quotes
      return `'${String(value).replace(/'/g, "''")}'`;
  }
};
