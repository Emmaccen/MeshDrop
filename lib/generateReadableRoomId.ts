const DEFAULT_PARTS = 2;
const DEFAULT_LENGTH = 4;
const DEFAULT_SEPARATOR = "-";

// Word lists for generating readable combinations
const CONSONANTS = "bcdfghjklmnpqrstvwxz";
const VOWELS = "aeiouy";
const DIGITS = "2-9"; // Avoiding 0/1 to prevent confusion with O/I

interface Config {
  parts: number;
  length: number;
  separator: string;
  includeDigits: boolean;
  capitalizeFirst: boolean;
}
/**
 * Generates a readable room ID string
 * @param {Object} options Configuration options
 * @param {number} options.parts Number of word parts (default: 3)
 * @param {number} options.length Length of each part (default: 4)
 * @param {string} options.separator Character to separate parts (default: '-')
 * @param {boolean} options.includeDigits Whether to include numbers (default: false)
 * @param {boolean} options.capitalizeFirst Whether to capitalize first letter of each part (default: false)
 * @returns {string} A readable room ID
 */
export function generateReadableRoomId(options?: Partial<Config>): string {
  const {
    parts = DEFAULT_PARTS,
    length = DEFAULT_LENGTH,
    separator = DEFAULT_SEPARATOR,
    includeDigits = false,
    capitalizeFirst = false,
  } = { ...options };

  // Validate inputs
  if (parts <= 0 || length <= 1) {
    throw new Error("Invalid room ID configuration");
  }

  const roomParts = [];

  // Generate each part of the room ID
  for (let i = 0; i < parts; i++) {
    const part = generateReadablePart(length, includeDigits, capitalizeFirst);
    roomParts.push(part);
  }

  return roomParts.join(separator);
}

/**
 * Generates a single readable part using alternating consonants and vowels
 * @param {number} length Length of the part to generate
 * @param {boolean} includeDigits Whether to include digits
 * @param {boolean} capitalizeFirst Whether to capitalize the first letter
 * @returns {string} A readable word part
 */
function generateReadablePart(
  length: number,
  includeDigits: boolean,
  capitalizeFirst: boolean
) {
  let part = "";

  // Generate alternating consonant-vowel pattern for readability
  for (let i = 0; i < length; i++) {
    // Even positions get consonants, odd positions get vowels
    const charSet = i % 2 === 0 ? CONSONANTS : VOWELS;

    // Maybe use a digit instead (if enabled)
    if (includeDigits && Math.random() < 0.2) {
      // 20% chance for a digit
      part += DIGITS.charAt(Math.floor(Math.random() * DIGITS.length));
    } else {
      part += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
  }

  // Capitalize first letter if requested
  if (capitalizeFirst) {
    part = part.charAt(0).toUpperCase() + part.slice(1);
  }

  return part;
}

export default generateReadableRoomId;
