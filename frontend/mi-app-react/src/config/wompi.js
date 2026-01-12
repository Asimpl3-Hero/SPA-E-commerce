// Wompi Payment Gateway Configuration
// Uses environment variables with fallback values for development
export const WOMPI_CONFIG = {
  API_URL: import.meta.env.VITE_WOMPI_API_URL || "https://api-sandbox.co.uat.wompi.dev/v1",
  PUBLIC_KEY: import.meta.env.VITE_WOMPI_PUBLIC_KEY || "pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7",
  BACKEND_URL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4567/api"}/checkout`,
  SCRIPT_URL: import.meta.env.VITE_WOMPI_SCRIPT_URL || "https://checkout.wompi.co/widget.js",
};

// Test data for sandbox environment
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
