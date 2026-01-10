/**
 * Application route constants
 * Centralized location for all route paths
 */

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CATEGORIES: '/categories',
  CATEGORY_DETAIL: '/categories/:category',
  CHECKOUT: '/checkout',
  ORDER_CONFIRMATION: '/order-confirmation/:orderId',
  ORDER_TRACKING: '/track-order/:orderId',
  ABOUT: '/about',
  CONTACT: '/contact',
  FAQ: '/faq',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  SHIPPING_RETURNS: '/shipping-returns',
  NOT_FOUND: '/404',
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

/**
 * All routes (no authentication required - guest checkout)
 */
export const APP_ROUTES = [
  ROUTES.HOME,
  ROUTES.PRODUCTS,
  ROUTES.PRODUCT_DETAIL,
  ROUTES.CATEGORIES,
  ROUTES.CATEGORY_DETAIL,
  ROUTES.CHECKOUT,
  ROUTES.ORDER_CONFIRMATION,
  ROUTES.ORDER_TRACKING,
  ROUTES.ABOUT,
  ROUTES.CONTACT,
  ROUTES.FAQ,
  ROUTES.PRIVACY_POLICY,
  ROUTES.TERMS_OF_SERVICE,
  ROUTES.SHIPPING_RETURNS,
  ROUTES.NOT_FOUND,
];

/**
 * Navigation menu items
 */
export const NAV_ITEMS = [
  {
    label: 'Home',
    path: ROUTES.HOME,
  },
  {
    label: 'Products',
    path: ROUTES.PRODUCTS,
  },
  {
    label: 'Categories',
    path: ROUTES.CATEGORIES,
  },
  {
    label: 'About',
    path: ROUTES.ABOUT,
  },
  {
    label: 'Contact',
    path: ROUTES.CONTACT,
  },
];

/**
 * Footer navigation sections
 */
export const FOOTER_NAV_SECTIONS = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', path: ROUTES.PRODUCTS },
      { label: 'Categories', path: ROUTES.CATEGORIES },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', path: ROUTES.CONTACT },
      { label: 'FAQ', path: ROUTES.FAQ },
      { label: 'Shipping & Returns', path: ROUTES.SHIPPING_RETURNS },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', path: ROUTES.ABOUT },
      { label: 'Privacy Policy', path: ROUTES.PRIVACY_POLICY },
      { label: 'Terms of Service', path: ROUTES.TERMS_OF_SERVICE },
    ],
  },
];
