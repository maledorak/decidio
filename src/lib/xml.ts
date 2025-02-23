import { XMLParser } from 'fast-xml-parser';

type Primitive = string | number | boolean;
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends Array<infer U>
    ? Array<DeepRequired<U>>
    : T[K] extends Primitive
      ? T[K]
      : DeepRequired<T[K]>;
};

export interface ExtractXMLResponse<T> {
  success: boolean;
  data?: DeepRequired<T>;
  error?: string;
}

function validateStructure<T>(obj: any, template: T, path: string[] = []): string[] {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return [`Invalid object at ${path.join('.')}`];
  }

  if (Array.isArray(template)) {
    if (!Array.isArray(obj)) {
      return [`Expected array at ${path.join('.')}`];
    }
    return obj.flatMap((item, index) =>
      validateStructure(item, template[0], [...path, index.toString()]));
  }

  for (const key in template) {
    const currentPath = [...path, key];
    const expectedValue = (template as any)[key];
    const actualValue = obj[key];

    if (actualValue === undefined) {
      errors.push(`Missing required field: ${currentPath.join('.')}`);
      continue;
    }

    if (Array.isArray(expectedValue)) {
      if (!Array.isArray(actualValue)) {
        errors.push(`Expected array at ${currentPath.join('.')}`);
      } else {
        actualValue.forEach((item, index) => {
          errors.push(...validateStructure(item, expectedValue[0], [...currentPath, index.toString()]));
        });
      }
    } else if (typeof expectedValue === 'object') {
      errors.push(...validateStructure(actualValue, expectedValue, currentPath));
    } else if (typeof expectedValue === 'number' && isNaN(Number(actualValue))) {
      errors.push(`Type mismatch at ${currentPath.join('.')}: expected number, got ${typeof actualValue}`);
    }
  }

  return errors;
}

export function extractXml<T extends object>(xmlString: string): ExtractXMLResponse<T> {
  if (!xmlString || typeof xmlString !== 'string') {
    return {
      success: false,
      error: 'Invalid input: XML string is required'
    };
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
    isArray: (name, jpath) => {
      return ['items'].includes(name) || jpath.endsWith('s');
    },
    numberParseOptions: {
      hex: true,
      leadingZeros: false
    }
  });

  try {
    const parsedXml = parser.parse(xmlString);

    if (!parsedXml || typeof parsedXml !== 'object' || Object.keys(parsedXml).length === 0) {
      throw new Error('Invalid XML structure');
    }

    const rootKey = Object.keys(parsedXml)[0];
    if (!parsedXml[rootKey]) {
      throw new Error('Missing root element');
    }

    function convertNumbers(obj: any): any {
      if (Array.isArray(obj)) {
        return obj.map(convertNumbers);
      }
      if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const key in obj) {
          try {
            result[key] = convertNumbers(obj[key]);
          } catch (err) {
            throw new Error(`Field ${key}: ${(err as Error).message}`);
          }
        }
        return result;
      }
      if (typeof obj === 'string') {
        if (/^-?\d+$/.test(obj)) return parseInt(obj, 10);
        if (/^-?\d+\.\d+$/.test(obj)) return parseFloat(obj);
      }
      return obj;
    }

    const converted = convertNumbers(parsedXml);

    const validationErrors = validateStructure(converted, {} as T);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`
      };
    }

    return {
      success: true,
      data: converted as DeepRequired<T>
    };
  } catch (err) {
    return {
      success: false,
      error: `Parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}
