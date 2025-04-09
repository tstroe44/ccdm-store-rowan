/* eslint-disable import/no-unresolved */
import { ProductListingPage } from '@dropins/storefront-search/containers/ProductListingPage.js';
import { render as provider } from '@dropins/storefront-search/render.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { getConfigValue, getHeaders } from '../../scripts/configs.js';

// Initializer
import('../../scripts/initializers/search.js');

async function getStoreDetails(headers) {
  // PLP Config
  const plpConfig = {
    pageSize: 8,
    perPageConfig: {
      pageSizeOptions: '12, 24, 36',
      defaultPageSizeOption: '12',
    },
    minQueryLength: '2',
    currencySymbol: '$',
    currencyRate: '1',
    displayOutOfStock: true,
    allowAllProducts: false,
    imageCarousel: false,
    optimizeImages: true,
    imageBaseWidth: 200,
    listview: false,
    currentCategoryUrlPath: null,
    displayMode: '',
    addToCart: () => {},
    route: {
      route: '/search',
      query: 'q',
    },
  };

  // Get Config Values
  const environmentId = await getConfigValue('commerce.headers.cs.Magento-Environment-Id');
  const apiKey = await getConfigValue('commerce.headers.cs.x-api-key');
  const apiUrl = await getConfigValue('commerce-endpoint');
  const websiteCode = await getConfigValue('commerce.headers.cs.Magento-Website-Code');
  const storeCode = await getConfigValue('commerce.headers.cs.Magento-Store-Code');
  const storeViewCode = await getConfigValue('commerce.headers.cs.Magento-Store-View-Code');
  const customerGroup = await getConfigValue('commerce.headers.cs.Magento-Customer-Group');
  const configHeaders = await getHeaders('cs');

  // Store Config
  const storeConfig = {
    type: 'eds',
    environmentId,
    environmentType: (async () => {
      const endpoint = apiUrl;
      return (endpoint.includes('sandbox')) ? 'testing' : '';
    })(),
    apiKey,
    apiUrl,
    websiteCode,
    storeCode,
    storeViewCode,
    customerGroup,
    route: ({ sku, urlKey }) => `/products/${urlKey}/${sku}`,
    defaultHeaders: {
      'Content-Type': 'application/json',
      ...configHeaders,
      ...headers,
    },
    config: plpConfig,
  };
  return storeConfig;
}

export async function renderPlpDropin(headers) {
  const storeConfig = await getStoreDetails(headers);
  const rootElement = document.getElementById('plp-widget-container');

  if (rootElement) {
    provider.render(ProductListingPage, { storeConfig })(
      rootElement,
    );
  } else {
    console.warn('Root element #plp-widget-container not found.');
  }
}

export default async function decorate(block) {
  const { category, type } = readBlockConfig(block);
  block.textContent = '';

  // for non search pages
  if (type !== 'search') {
    // Enable enrichment
    block.dataset.category = category;
  }
  const selectedBrand = window.localStorage.getItem('selectedBrand') || '';
  const selectedModel = (window.localStorage.getItem('selectedBrand') && window.localStorage.getItem('selectedModel')) || '';

  const widget = document.createElement('div');
  widget.id = 'plp-widget-container';
  block.appendChild(widget);
  await renderPlpDropin({
    ...(selectedBrand ? { 'AC-Policy-Brand': selectedBrand } : {}),
    ...(selectedModel ? { 'AC-Policy-Model': selectedModel } : {}),
  });
}
