/* eslint-disable import/no-unresolved */
import { render as provider } from '@dropins/storefront-search/render.js';
import SearchPopover from '@dropins/storefront-search/containers/SearchPopover.js';
import {
  setFetchGraphQlHeaders,
} from '@dropins/storefront-search/api.js';

import { getConfigValue, getHeaders } from '../../scripts/configs.js';

async function getStoreDetails() {
  const [
    apiUrl,
    customerGroup,
  ] = await Promise.all([
    getConfigValue('commerce-endpoint'),
    getConfigValue('commerce-customer-group'),
  ]);
  return {
    apiUrl,
    config: {
      pageSize: 8,
      perPageConfig: {
        pageSizeOptions: '12,24,36',
        defaultPageSizeOption: '24',
      },
      minQueryLength: '2',
      currencySymbol: '$',
      currencyRate: '1',
      displayOutOfStock: true,
      allowAllProducts: false,
    },
    context: {
      customerGroup,
    },
    route: ({ sku, urlKey }) => `/products/${urlKey}/${sku}`,
    searchRoute: {
      route: '/search',
      query: 'q',
    },
  };
}

export default async function initSearchPopover(headers) {
  import('../../scripts/initializers/search.js');
  try {
    const storeDetails = await getStoreDetails();
    const apiHeaders = await getHeaders('cs');
    setFetchGraphQlHeaders({ ...apiHeaders, ...headers });
    const rootElement = document.getElementById('search_autocomplete');

    if (rootElement) {
      provider.render(SearchPopover, { storefrontDetails: storeDetails })(
        rootElement,
      );
    } else {
      console.error('Root element #search_autocomplete not found.');
    }
  } catch (error) {
    console.error('Failed to initialize search popover:', error);
  }
}
