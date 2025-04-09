/* eslint-disable import/no-unresolved */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

import renderAuthCombine from './renderAuthCombine.js';
import { renderAuthDropdown } from './renderAuthDropdown.js';

import { renderPlpDropin } from '../product-list-page/product-list-page.js';
import initSearchPopover from './searchbar.js';
import { getConfigValue } from '../../scripts/configs.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const brandIds = {
  Aurora: { id: 'b726c1e9-2842-4ab5-9b19-ca65c23bbb3b', value: 'Aurora', models: ['Flux', 'Nexus', 'Nova', 'Prism', 'Pulse'] },
  Bolt: { id: '552fb8e1-978f-42c5-aab2-d96642e436d8', value: 'Bolt', models: ['Atlas', 'Mammoth', 'Ranger', 'Scout', 'Terrain'] },
  Cruz: { id: '7140c0dc-0abf-4817-91ad-22f4edceeb85', value: 'Cruz', models: ['Breeze', 'Echo', 'Element', 'Harmony', 'Verde'] },
};

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      document.getElementsByTagName('main')[0].classList.remove('overlay');
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
      document.getElementsByTagName('main')[0].classList.remove('overlay');
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, true);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

const activeSubmenu = document.createElement('div');
activeSubmenu.classList.add('active-submenu');
activeSubmenu.innerHTML = `
    <button>All Categories</button>
    <h6>Title</h6><ul><li class="nav-drop"></li></ul>
`;

/**
 * Sets up the menu for mobile
 * @param {navSection} navSection The nav section element
 */
function setupMobileMenu(navSection) {
  if (!isDesktop.matches && navSection.querySelector('ul')) {
    let label;
    if (navSection.childNodes.length) {
      [label] = navSection.childNodes;
    }

    const subMenu = navSection.querySelector('ul');
    const clonedSubMenu = subMenu.cloneNode(true);

    navSection.addEventListener('click', () => {
      activeSubmenu.classList.add('visible');
      activeSubmenu.querySelector('h6').textContent = label.textContent;
      activeSubmenu.querySelector('li')
        .append(clonedSubMenu);
    });
  }
}

/**
 * Creates a button to clear selections
 * @returns {Element} The clear selections button
 */
function createClearedSelectionsButton() {
  const closeBtnDiv = document.createElement('li');
  const closeBtn = document.createElement('p');
  closeBtn.addClassName = 'nav-close-btn';
  closeBtn.textContent = 'Clear Selections';
  closeBtnDiv.id = 'clear-selections';
  closeBtnDiv.style.display = window.localStorage.getItem('selectedBrand') ? 'block' : 'none';
  closeBtnDiv.appendChild(closeBtn);
  closeBtn.addEventListener('click', () => {
    const brandSelect = document.getElementById('select-brand').querySelector('p');
    const modelSelect = document.getElementById('select-model').querySelector('p');
    const modelList = document.getElementById('select-model').querySelector('ul');
    brandSelect.textContent = 'Brand';
    modelSelect.textContent = 'Model';
    modelList.innerHTML = '';
    closeBtnDiv.style.display = 'none';
    window.localStorage.removeItem('selectedBrand');
    window.localStorage.removeItem('selectedModel');
    renderPlpDropin({});
  });
  return closeBtnDiv;
}

// Display clear selections button
function showClearSelectionsButton() {
  const closeBtn = document.getElementById('clear-selections');
  closeBtn.style.display = 'block';
}

// Set selected model
function setSelectedModel(modelName) {
  if (modelName) {
    const selectedModel = modelName;
    document.getElementById('select-model').querySelector('p').textContent = `Model: ${selectedModel}`;
    window.localStorage.setItem('selectedModel', selectedModel);
    showClearSelectionsButton();
  } else {
    document.getElementById('select-model').querySelector('p').textContent = 'Model';
    window.localStorage.removeItem('selectedModel');
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');

  // Add clear selections button
  const clearSelectionsBtn = createClearedSelectionsButton();
  navSections.querySelector('.default-content-wrapper > ul').appendChild(clearSelectionsBtn);

  const dealershipName = await getConfigValue('dealer-name');

  if (navSections) {
    // set selected values to local storage value or empty
    const localStorageBrand = window.localStorage.getItem('selectedBrand');
    const localStorageModel = window.localStorage.getItem('selectedModel');
    const selectedBrand = brandIds[localStorageBrand] || '';
    const selectedModel = (selectedBrand && localStorageModel && selectedBrand.models.includes(localStorageModel)) ? localStorageModel : '';

    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        const dropdownText = navSection.querySelector('p').textContent.split(':')[0];
        const dropdownId = dropdownText.toLowerCase().replace(' ', '-');

        if (navSection.querySelector('ul')) {
          navSection.id = `select-${dropdownId}`;
          navSection.classList.add('nav-drop');
        }

        if (selectedBrand && navSection.id === 'select-brand') {
          navSection.querySelector('p').textContent = `Brand: ${selectedBrand.value}`;
          window.localStorage.setItem('selectedBrand', selectedBrand.value);
        }

        navBrand.querySelector('a').title = dealershipName;
        navBrand.querySelector('a').textContent = dealershipName;

        // on select model clicks
        if (navSection.id === 'select-model') {
          const modelList = navSection.querySelector('ul');
          modelList.innerHTML = '';
        }
        if (selectedBrand && navSection.id === 'select-model') {
          const modelList = navSection.querySelector('ul');
          modelList.innerHTML = '';

          selectedBrand.models.forEach((model) => {
            const li = document.createElement('li');
            li.textContent = model;
            modelList.appendChild(li);
          });
        }

        if (selectedModel && navSection.id === 'select-model') {
          if (selectedBrand.models.includes(selectedModel)) {
            // Dropdown doesn't exist on document so cant use setModel function
            navSection.querySelector('p').textContent = `Model: ${selectedModel}`;
            window.localStorage.setItem('selectedModel', selectedModel);
          }
        }

        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        setupMobileMenu(navSection);
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });

    // FOR CCDM DEMO ONLY

    const dropdownItems = navSections.querySelectorAll(':scope .default-content-wrapper > ul > li > ul > li');
    const dropDownClickHandler = (navItem) => () => {
      const navSection = navItem.parentNode.parentNode.querySelector('p');
      const selectedItem = navItem.textContent;
      const currentModel = document.getElementById('select-model').querySelector('p').innerText.split(':')[1]?.trim();

      if (navSection.textContent.includes('Brand') && brandIds[selectedItem]) {
        navSection.innerText = `Brand: ${selectedItem}`;
        window.localStorage.setItem('selectedBrand', selectedItem);
        showClearSelectionsButton();

        const { models } = brandIds[selectedItem];

        const modelList = document.getElementById('select-model').querySelector('ul');
        modelList.innerHTML = '';
        models.forEach((model) => {
          const li = document.createElement('li');
          li.textContent = model;
          const modelNode = modelList.appendChild(li);
          modelNode.addEventListener('click', dropDownClickHandler(modelNode));
        });

        if (!models.includes(currentModel)) {
          setSelectedModel();
        }
      }

      if (navSection.textContent.includes('Model')) {
        setSelectedModel(selectedItem);
      }

      // render PLP dropin with selected model in policy header
      const ddBrand = document.getElementById('select-brand').querySelector('p').innerText.split(':')[1]?.trim();
      const ddModel = document.getElementById('select-model').querySelector('p').innerText.split(':')[1]?.trim();
      renderPlpDropin({
        ...(ddBrand ? { 'AC-Policy-Brand': ddBrand } : {}),
        ...(ddModel ? { 'AC-Policy-Model': ddModel } : {}),
      });
    };

    dropdownItems
      // listen for individual clicks
      .forEach((navItem) => {
        navItem.addEventListener('click', dropDownClickHandler(navItem));
      });
  }

  if (!isDesktop.matches) {
    activeSubmenu.querySelector('button').addEventListener('click', () => {
      activeSubmenu.classList.remove('visible');
      activeSubmenu.querySelector('.nav-drop').removeChild(activeSubmenu.querySelector('.nav-drop ul'));
    });

    navSections.append(activeSubmenu);
  }
  const navTools = nav.querySelector('.nav-tools');

  /** Search */

  // TODO
  const search = document.createRange().createContextualFragment(`
  <div class="search-wrapper nav-tools-wrapper">
    <button type="button" class="nav-search-button">Search</button>
    <div class="nav-search-input nav-search-panel nav-tools-panel">
      <form action="/search" method="GET">
        <input id="search" type="search" name="q" placeholder="Search" />
        <div id="search_autocomplete" class="search-autocomplete"></div>
      </form>
    </div>
  </div>
  `);

  navTools.append(search);

  const searchPanel = navTools.querySelector('.nav-search-panel');

  const searchButton = navTools.querySelector('.nav-search-button');

  const searchInput = searchPanel.querySelector('input');

  async function toggleSearch(state) {
    const show = state ?? !searchPanel.classList.contains('nav-tools-panel--show');

    searchPanel.classList.toggle('nav-tools-panel--show', show);

    if (show) {
      const selectedBrand = document.getElementById('select-brand').querySelector('p').innerText.split(':')[1]?.trim();
      const selectedModel = document.getElementById('select-model').querySelector('p').innerText.split(':')[1]?.trim();
      const selectedHeaders = {
        ...(selectedBrand ? { 'AC-Policy-Brand': selectedBrand } : {}),
        ...(selectedModel ? { 'AC-Policy-Model': selectedModel } : {}),
      };
      initSearchPopover(selectedHeaders);
      searchInput.focus();
    }
  }

  navTools.querySelector('.nav-search-button').addEventListener('click', () => toggleSearch());

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
      toggleSearch(false);
    }
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.classList.add(dealershipName?.toLowerCase().replace(' ', '-'));
  navWrapper.append(nav);
  block.append(navWrapper);

  renderAuthCombine(
    navSections,
    () => !isDesktop.matches && toggleMenu(nav, navSections, false),
  );
  renderAuthDropdown(navTools);
}
