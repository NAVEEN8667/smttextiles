const pool = require('./db');

async function seedEnhancedProducts() {
  const client = await pool.connect();
  try {
    console.log('Seeding enhanced product data...');

   
   
    
    const luxuryProduct = {
      name: 'Royal Banarasi Silk Saree',
      description: 'Handcrafted with pure mulberry silk and real zari. This masterpiece features intricate floral motifs and a grand pallu, perfect for weddings and heritage occasions.',
      price: 15999.00,
      category: 'Saree',
      image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviews_count: 124,
      discount: 15,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800'
      ]),
      variants: JSON.stringify(['Classic Gold', 'Rose Tint', 'Emerald Green', 'Deep Maroon']),
      is_active: true
    };

    const res = await client.query(
      `INSERT INTO products 
       (name, description, price, category, image_url, rating, reviews_count, discount, images, variants, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        luxuryProduct.name,
        luxuryProduct.description,
        luxuryProduct.price,
        luxuryProduct.category,
        luxuryProduct.image_url,
        luxuryProduct.rating,
        luxuryProduct.reviews_count,
        luxuryProduct.discount,
        luxuryProduct.images,
        luxuryProduct.variants,
        luxuryProduct.is_active
      ]
    );

    const productId = res.rows[0].id;
    await client.query(
      'INSERT INTO inventory (product_id, quantity_available) VALUES ($1, $2) ON CONFLICT (product_id) DO UPDATE SET quantity_available = $2',
      [productId, 25]
    );

    console.log('✅ Enhanced product seeded with ID:', productId);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}

seedEnhancedProducts();
