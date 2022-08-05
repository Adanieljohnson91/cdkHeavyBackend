/**
 * Interface for form input
 */
export interface IInput {
  hex: string
}

/**
 * PageStatus
 */
export interface PageStatus {
  status: string;
  message: string;
}

/**
 * InputStatus to define state of form
 */
export enum InputStatus {
  UNKNOWN = "UNKNOWN",
  PENDING = "PENDING",
  VALID = "VALID",
  INVALID = "INVALID",
  SUCCESS = "SUCCESS",
}

/**
 * Messages to give back to user based on page status
 */
export const PAGE_MESSAGES = {
  UNKNOWN: "",
  VALID: "ready to send hex for calculation",
  PENDING: "pending calculation, may take up to 24hrs",
  INVALID: "invalid entry. [0-9][a-f]",
  SUCCESS: "success",
};

/**
 * Request definitions
 * hex: 256-bit hexadecimal string value
 */
export interface ICalculationRequest {
  hex: string
}