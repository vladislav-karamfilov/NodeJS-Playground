var BEER_TYPE = 'beer',
  FRIES_TYPE = 'fries';

function beerAndFries(items) {
  'use strict';

  var currentBeerIndex = -1,
    currentFriesIndex = -1,
    score = 0,
    currentProduct,
    i = 0,
    itemsCount = items.length;

  items.sort(function (firstItem, secondItem) {
    return firstItem.score - secondItem.score;
  });

  for (; i < itemsCount / 2; i++) {
    if ((items[i].type == BEER_TYPE && currentBeerIndex == i) ||
      (items[i].type == FRIES_TYPE && currentFriesIndex == i)) {
      i++; // Current item was processed
    }

    currentProduct = items[i].score;

    if (items[i].type == BEER_TYPE) {
      currentFriesIndex = getIndexOfItemWithType(items, currentFriesIndex + 1, FRIES_TYPE);
      currentProduct *= items[currentFriesIndex].score;

      currentBeerIndex = i;
    } else { // Fries type
      currentBeerIndex = getIndexOfItemWithType(items, currentBeerIndex + 1, BEER_TYPE);
      currentProduct *= items[currentBeerIndex].score;

      currentFriesIndex = i;
    }

    score += currentProduct;
  }

  return score;
}

function getIndexOfItemWithType(items, startIndex, type) {
  'use strict';

  var i = startIndex,
    itemsCount = items.length,
    index = -1;

  for (; i < itemsCount; i++) {
    if (items[i].type == type) {
      index = i;
      break;
    }
  }

  return index;
}

module.exports = beerAndFries;