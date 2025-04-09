import { getConfigValue } from './configs.js';

const dealerships = ['carvelo', 'arkbridge', 'kingsbluff', 'celport'];
const getDealershipName = async () => (await getConfigValue('dealer-name'))?.toLowerCase();

const hideMainPictures = async (dealshipName, main) => {
  const mainPictures = main.querySelectorAll('picture');
  // carvelo (0), arkbridge (1), kingsbluff (2), celport (3)

  switch (dealshipName) {
    case 'carvelo':
      mainPictures[0].style.display = null;
      mainPictures[1].style.display = 'none';
      mainPictures[2].style.display = 'none';
      mainPictures[3].style.display = 'none';
      break;
    case 'arkbridge':
      mainPictures[0].style.display = 'none';
      mainPictures[1].style.display = null;
      mainPictures[2].style.display = 'none';
      mainPictures[3].style.display = 'none';
      break;
    case 'kingsbluff':
      mainPictures[0].style.display = 'none';
      mainPictures[1].style.display = 'none';
      mainPictures[2].style.display = null;
      mainPictures[3].style.display = 'none';
      break;
    case 'celport':
      mainPictures[0].style.display = 'none';
      mainPictures[1].style.display = 'none';
      mainPictures[2].style.display = 'none';
      mainPictures[3].style.display = null;
      break;
    default: // default to 'arkbridge' laylout
      mainPictures[0].style.display = 'none';
      mainPictures[1].style.display = null;
      mainPictures[2].style.display = 'none';
      mainPictures[3].style.display = 'none';
      break;
  }
};

const hideBrandContent = async (dealshipName, main) => {
  const columnsSections = main.querySelector("div[data-block-name='columns']");
  const brandContentSections = columnsSections.querySelectorAll('div');
  // arora (0), bolt (3), cruz (6)

  switch (dealshipName) {
    case 'kingsbluff':
    case 'celport':
      // show bolt (3) and cruz (6)
      brandContentSections[0].style.display = 'none';
      break;
    case 'arkbridge':
    case 'carvelo':
    default:
      // show all sections
      brandContentSections[0].style.display = null;
      brandContentSections[3].style.display = null;
      brandContentSections[6].style.display = null;
      break;
  }
};

const summitOverrides = async (main) => {
  // only run on the index page
  if (window.location.pathname !== '/') return main;

  const dealershipName = await getDealershipName();

  if (dealerships.includes(dealershipName)) {
    // search through main and show/hide elements based on the dealership
    await hideMainPictures(dealershipName, main);
    await hideBrandContent(dealershipName, main);
  }

  return main;
};

export default summitOverrides;
