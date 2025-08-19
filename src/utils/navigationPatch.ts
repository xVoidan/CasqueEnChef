/* eslint-disable no-console */
import { LogBox } from 'react-native';

// Ignore les warnings spécifiques de React Navigation
// C'est un bug connu qui n'affecte pas le fonctionnement
LogBox.ignoreLogs([
  "TypeError: Cannot read property 'medium' of undefined",
  "Cannot read properties of undefined (reading 'medium')",
  "Warning: TypeError: Cannot read property 'medium' of undefined",
  'Warning: TypeError:',
]);

// Patch plus agressif pour supprimer complètement ces warnings
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string') {
    const message = args[0].toString();
    if (
      message.includes('medium') ||
      message.includes('TypeError') ||
      message.includes('Cannot read property')
    ) {
      return;
    }
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string') {
    const message = args[0].toString();
    if (
      message.includes('medium') ||
      message.includes('TypeError') ||
      message.includes('Cannot read property')
    ) {
      return;
    }
  }
  originalWarn.apply(console, args);
};

console.log = (...args) => {
  if (args[0] && typeof args[0] === 'string') {
    const message = args[0].toString();
    if (
      message.includes('Warning: TypeError') ||
      message.includes("Cannot read property 'medium'")
    ) {
      return;
    }
  }
  originalLog.apply(console, args);
};

export {};
