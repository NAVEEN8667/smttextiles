
const normalize = (val, max, min) => {
  if (max === min) return 0;
  return (val - min) / (max - min);
};


const getKNearestNeighbors = (targetProfile, allProducts, k = 4) => {
  if (!allProducts || allProducts.length === 0) return [];
  if (!targetProfile || targetProfile.length === 0) return getRandomTopRatedFallback(allProducts, k);

  const prices = allProducts.map(p => parseFloat(p.price));
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  const ratings = allProducts.map(p => parseFloat(p.rating));
  const maxRating = Math.max(...ratings);
  const minRating = Math.min(...ratings);


  const profileCategories = new Set(targetProfile.map(item => item.category));
  const avgProfilePrice = targetProfile.reduce((sum, item) => sum + parseFloat(item.price), 0) / targetProfile.length;
  const avgProfileRating = targetProfile.reduce((sum, item) => sum + parseFloat(item.rating), 0) / targetProfile.length;

  const targetNormPrice = normalize(avgProfilePrice, maxPrice, minPrice);
  const targetNormRating = normalize(avgProfileRating, maxRating, minRating);


  const profileProductIds = new Set(targetProfile.map(item => item.product_id || item.id));

  const eligibleProducts = allProducts.filter(p => !profileProductIds.has(p.id));

  if (eligibleProducts.length === 0) return getRandomTopRatedFallback(allProducts, k);


  const distances = eligibleProducts.map(product => {
    const prodNormPrice = normalize(parseFloat(product.price), maxPrice, minPrice);
    const prodNormRating = normalize(parseFloat(product.rating), maxRating, minRating);


    const categoryDist = profileCategories.has(product.category) ? 0 : 1;


    const wPrice = 0.3;
    const wRating = 0.2;
    const wCategory = 0.5;

    const distance = Math.sqrt(
      wPrice * Math.pow(targetNormPrice - prodNormPrice, 2) +
      wRating * Math.pow(targetNormRating - prodNormRating, 2) +
      wCategory * Math.pow(categoryDist, 2)
    );

    return { product, distance };
  });


  distances.sort((a, b) => a.distance - b.distance);


  return distances.slice(0, k).map(d => d.product);
};


const getRandomTopRatedFallback = (allProducts, k = 4) => {

  const sorted = [...allProducts].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

  const top10 = sorted.slice(0, 10);
  for (let i = top10.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top10[i], top10[j]] = [top10[j], top10[i]];
  }
  return top10.slice(0, k);
};

module.exports = { getKNearestNeighbors };
