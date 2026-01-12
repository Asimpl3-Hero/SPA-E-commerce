/**
 * Application route constants
 * Centralized location for all route paths
 */

export const ROUTES = {
  HOME: '/',
  CHECKOUT: '/checkout',
  ORDER_CONFIRMATION: '/order-confirmation/:orderId',
};

/**
 * Helper function to generate route with parameters
 * @param {string} route - Route template
 * @param {Object} params - Parameters to replace
 * @returns {string} Generated route
 */
export const generateRoute = (route, params = {}) => {
  let generatedRoute = route;

  Object.entries(params).forEach(([key, value]) => {
    generatedRoute = generatedRoute.replace(`:${key}`, value);
  });

  return generatedRoute;
};
