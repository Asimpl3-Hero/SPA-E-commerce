/**
 * Mock for Wompi configuration in tests
 * This mock avoids import.meta.env issues in Jest
 */
export const WOMPI_CONFIG = {
  API_URL: "https://api-sandbox.co.uat.wompi.dev/v1",
  PUBLIC_KEY: "pub_test_mock_key_12345",
  BACKEND_URL: "http://localhost:4567/api/checkout",
  SCRIPT_URL: "https://checkout.wompi.co/widget.js",
};

/**
 * Test data for sandbox environment
 */
export const WOMPI_TEST_DATA = {
  CARD: {
    number: "4242 4242 4242 4242",
    cvc: "Any 3 digits",
    expiration: "Any future date",
  },
  NEQUI: {
    approved: "3991111111",
    declined: "3992222222",
  },
};
