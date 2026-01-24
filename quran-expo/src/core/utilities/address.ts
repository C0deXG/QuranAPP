/**
 * Address.swift → address.ts
 *
 * Object identification utilities translated from quran-ios Core/Utilities
 * Created by Mohamed Afifi on 2023-05-27.
 *
 * Note: JavaScript doesn't expose memory addresses, but we can create
 * unique identifiers for objects for debugging purposes.
 */

/**
 * WeakMap to store unique IDs for objects
 */
const objectIds = new WeakMap<object, string>();

/**
 * Counter for generating unique IDs
 */
let nextId = 1;

/**
 * Generates a unique hex-like identifier for an object.
 * This simulates the Swift address(of:) function.
 *
 * @param obj - The object to get an ID for
 * @returns A unique hex-like string identifier
 *
 * @example
 * const myObject = { name: 'test' };
 * console.log(addressOf(myObject)); // "0x1"
 * console.log(addressOf(myObject)); // "0x1" (same object = same address)
 */
export function addressOf(obj: object): string {
  let id = objectIds.get(obj);
  if (!id) {
    id = `0x${nextId.toString(16)}`;
    nextId++;
    objectIds.set(obj, id);
  }
  return id;
}

/**
 * Returns a debug description with type name and address.
 * This simulates the Swift nameAndAddress(of:) function.
 *
 * @param obj - The object to describe
 * @returns A string in format "<TypeName: 0xAddress>"
 *
 * @example
 * class MyClass {}
 * const instance = new MyClass();
 * console.log(nameAndAddress(instance)); // "<MyClass: 0x1>"
 */
export function nameAndAddress(obj: object): string {
  const typeName = getTypeName(obj);
  const address = addressOf(obj);
  return `<${typeName}: ${address}>`;
}

/**
 * Gets the type/class name of an object.
 *
 * @param obj - The object to get the type name of
 * @returns The constructor name or 'Object'
 */
export function getTypeName(obj: object): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  // Try to get the constructor name
  const constructor = obj.constructor;
  if (constructor && constructor.name) {
    return constructor.name;
  }

  // Fallback to Object.prototype.toString
  const toString = Object.prototype.toString.call(obj);
  const match = toString.match(/\[object (\w+)\]/);
  return match ? match[1] : 'Object';
}

/**
 * Creates a debug description for any value.
 *
 * @param value - Any value to describe
 * @returns A debug-friendly string representation
 */
export function debugDescription(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'object') {
    return nameAndAddress(value);
  }

  if (typeof value === 'function') {
    return `<Function: ${value.name || 'anonymous'}>`;
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
}

/**
 * Checks if two objects are the same instance (reference equality).
 *
 * @param a - First object
 * @param b - Second object
 * @returns true if they are the same reference
 */
export function isSameInstance(a: object, b: object): boolean {
  return a === b;
}

/**
 * Creates a unique identifier string for debugging purposes.
 * Unlike addressOf, this always generates a new ID.
 *
 * @returns A unique hex-like identifier
 */
export function uniqueId(): string {
  const id = `0x${nextId.toString(16)}`;
  nextId++;
  return id;
}

/**
 * Resets the ID counter (useful for testing).
 * @internal
 */
export function _resetIdCounter(): void {
  nextId = 1;
}

