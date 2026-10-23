import { connectDB } from "../src/config/db.js";
import cloudinary from "../src/config/cloudinary.js";
import Category from "../src/models/Category.js";
import Product from "../src/models/Product.js";
import mongoose from "mongoose";

const image = (photoId) => `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1000&q=82`;
const FALLBACK_PHOTO_ID = "photo-1490481651871-ab68de25d43d";

const catalog = [
  {
    category: { name: "Home Decor", slug: "home-decor", description: "Thoughtful accents and useful details for a considered home." },
    products: [
      ["Ribbed Ceramic Vase", 289000, "A sculptural ceramic vase with a softly ribbed finish.", "Studio Form", ["ceramic", "decor", "vase"], "photo-1490312278390-ab64016e0aa9"],
      ["Linen Cushion Cover", 195000, "A breathable linen cover in a calm, easy-to-style neutral.", "Naqsh Home", ["linen", "cushion", "textile"], "photo-1616486338812-3dadae4b4ace"],
      ["Woven Table Basket", 245000, "Handwoven texture for keeping everyday essentials close.", "Naqsh Home", ["woven", "storage", "basket"], "photo-1494438639946-1ebd1d20bf85"],
      ["Arched Photo Frame", 179000, "A minimal arched frame for a favorite print or photograph.", "Studio Form", ["frame", "decor", "gift"], "photo-1513519245088-0e12902e5a38"],
      ["Soft Glow Table Lamp", 649000, "A warm, ambient table lamp with a timeless silhouette.", "Luma Living", ["lighting", "lamp", "home"], "photo-1507473885765-e6ed057f782c"],
      ["Textured Throw Blanket", 459000, "A soft, generously sized throw for slow evenings.", "Naqsh Home", ["throw", "textile", "comfort"], "photo-1583847268964-b28dc8f51f92"],
      ["Stoneware Planter", 239000, "A simple stoneware planter that brings greenery indoors.", "Studio Form", ["planter", "ceramic", "plant"], "photo-1493663284031-b7e3aefcae8e"],
      ["Oak Catchall Tray", 219000, "A neat landing spot for keys, jewelry, and small essentials.", "Naqsh Home", ["wood", "organizer", "tray"], "photo-1600210492486-724fe5c67fb0"],
      ["Minimal Wall Clock", 385000, "A clean-faced clock designed to sit quietly in any room.", "Luma Living", ["clock", "wall", "decor"], "photo-1505693416388-ac5ce068fe85"],
      ["Hand-poured Soy Candle", 165000, "A slow-burning soy candle with a soft botanical fragrance.", "Sukoon", ["candle", "scent", "wellness"], "photo-1602874801007-bd458bb1b8b6"],
    ],
  },
  {
    category: { name: "Clothing", slug: "clothing", description: "Comfortable wardrobe staples with considered details." },
    products: [
      ["Everyday Cotton Shirt", 349000, "An easy-fit cotton shirt made for everyday layering.", "Thread & Form", ["cotton", "shirt", "everyday"], "photo-1521572163474-6864f9cf17ab"],
      ["Relaxed Linen Kurta", 425000, "A breathable relaxed-fit kurta with a clean, versatile shape.", "Thread & Form", ["linen", "kurta", "summer"], "photo-1490481651871-ab68de25d43d"],
      ["Classic Denim Jacket", 895000, "A dependable denim layer with a softly structured fit.", "Northline", ["denim", "jacket", "layer"], "photo-1551028719-00167b16eac5"],
      ["Ribbed Knit Top", 389000, "A soft ribbed top that pairs easily with relaxed or tailored pieces.", "Thread & Form", ["knit", "top", "basics"], "photo-1503342217505-b0a15ec3261c"],
      ["Wide-leg Cotton Trousers", 595000, "Easy-moving cotton trousers with a flattering wide-leg cut.", "Northline", ["cotton", "trousers", "relaxed"], "photo-1529139574466-a303027c1d8b"],
      ["Everyday Graphic Tee", 245000, "A comfortable midweight tee with a simple considered finish.", "Thread & Form", ["tee", "cotton", "casual"], "photo-1523381210434-271e8be1f52b"],
      ["Soft Wrap Cardigan", 725000, "A light, cozy cardigan that works across changing seasons.", "Northline", ["knit", "cardigan", "layer"], "photo-1548126032-079a0fb0099d"],
      ["Pleated Midi Skirt", 545000, "A fluid midi skirt with soft movement and an easy waist.", "Thread & Form", ["skirt", "midi", "wardrobe"], "photo-1512436991641-6745cdb1723f"],
      ["Textured Overshirt", 685000, "A substantial overshirt for an effortless extra layer.", "Northline", ["overshirt", "layer", "textured"], "photo-1551488831-00ddcb6c6bd3"],
      ["Soft Lounge Set", 795000, "A relaxed matching set for comfortable days at home.", "Sukoon Wear", ["lounge", "comfort", "set"], "photo-1490481651871-ab68de25d43d"],
    ],
  },
  {
    category: { name: "Bags & Accessories", slug: "bags-accessories", description: "Useful finishing touches for daily routines and weekends away." },
    products: [
      ["Everyday Canvas Tote", 275000, "A sturdy canvas carryall sized for daily essentials.", "Field Notes", ["bag", "canvas", "everyday"], "photo-1544816155-12df9643f363"],
      ["Compact Crossbody Bag", 685000, "A compact hands-free bag with room for the essentials.", "Field Notes", ["bag", "crossbody", "travel"], "photo-1548036328-c9fa89d128fa"],
      ["Leather Card Holder", 325000, "A slim leather card holder that keeps pockets light.", "Form Goods", ["leather", "wallet", "everyday"], "photo-1627123424574-724758594e93"],
      ["Woven Summer Hat", 395000, "A lightweight woven hat for sunny afternoons outdoors.", "Field Notes", ["hat", "woven", "summer"], "photo-1521369909029-2afed882baee"],
      ["Classic Everyday Watch", 1195000, "A simple everyday watch with a clean, easy-to-read dial.", "Form Goods", ["watch", "accessory", "gift"], "photo-1523275335684-37898b6baf30"],
      ["Sculpted Hoop Earrings", 285000, "Lightweight sculpted hoops with a polished finish.", "Kiran Studio", ["jewelry", "earrings", "gift"], "photo-1535632066927-ab7c9ab60908"],
      ["Layered Chain Necklace", 345000, "A delicate layered chain designed for daily wear.", "Kiran Studio", ["jewelry", "necklace", "layer"], "photo-1515562141207-7a88fb7ce338"],
      ["Tortoise Reading Glasses", 425000, "A lightweight frame with a classic tortoise finish.", "Form Goods", ["glasses", "accessory", "reading"], "photo-1511499767150-a48a237f0083"],
      ["Everyday Leather Belt", 395000, "A versatile leather belt with a brushed metal buckle.", "Field Notes", ["leather", "belt", "wardrobe"], "photo-1553062407-98eeb64c6a62"],
      ["Soft Weekend Backpack", 895000, "A practical, comfortable backpack for commutes and short trips.", "Field Notes", ["bag", "backpack", "travel"], "photo-1553062407-98eeb64c6a62"],
    ],
  },
  {
    category: { name: "Kitchen & Dining", slug: "kitchen-dining", description: "Everyday kitchen pieces made for gathering and sharing." },
    products: [
      ["Speckled Ceramic Mug", 185000, "A comfortable stoneware mug with a gentle speckled glaze.", "Table Story", ["ceramic", "mug", "kitchen"], "photo-1514228742587-6b1558fcca3d"],
      ["Hand-thrown Serving Bowl", 325000, "A versatile serving bowl for fruit, salads, and shared meals.", "Table Story", ["ceramic", "bowl", "dining"], "photo-1490645935967-10de6ba17061"],
      ["Linen Tea Towel Set", 225000, "A pair of absorbent linen-blend towels for everyday kitchen use.", "Table Story", ["linen", "kitchen", "textile"], "photo-1556911220-bff31c812dba"],
      ["Acacia Serving Board", 345000, "A warm-grained board for serving bread, cheese, or small bites.", "Table Story", ["wood", "serving", "dining"], "photo-1547592180-85f173990554"],
      ["Double-wall Glass Set", 295000, "Clear double-wall glasses for coffee, tea, and cool drinks.", "Table Story", ["glass", "drinkware", "kitchen"], "photo-1513558161293-cdaf765edfd7"],
      ["Reusable Water Bottle", 385000, "A durable reusable bottle for commutes and daily routines.", "Form Goods", ["bottle", "reusable", "travel"], "photo-1602143407151-7111542de6e8"],
      ["Pour-over Coffee Set", 625000, "A compact pour-over set for a slower, more thoughtful coffee ritual.", "Daybreak", ["coffee", "pour-over", "kitchen"], "photo-1495474472287-4d71bcdd2085"],
      ["Cotton Table Runner", 325000, "A textured cotton runner that brings a soft finish to the table.", "Table Story", ["cotton", "table", "dining"], "photo-1600566753086-00f18fb6b3ea"],
      ["Minimal Oil Dispenser", 215000, "A tidy countertop dispenser for olive oil and everyday cooking oils.", "Table Story", ["kitchen", "cooking", "glass"], "photo-1556911220-e15b29be8c8f"],
      ["Wooden Salad Servers", 195000, "A lightweight wooden pair for tossing and serving fresh salads.", "Table Story", ["wood", "serving", "kitchen"], "photo-1512621776951-a57141f2eefd"],
    ],
  },
  {
    category: { name: "Self Care", slug: "self-care", description: "Small comforts for a calmer daily routine." },
    products: [
      ["Botanical Hand Wash", 245000, "A gentle everyday hand wash with a fresh botanical scent.", "Sukoon", ["bath", "botanical", "self-care"], "photo-1608248543803-ba4f8c70ae0b"],
      ["Nourishing Hand Cream", 195000, "A fast-absorbing hand cream for soft, comfortable skin.", "Sukoon", ["skincare", "hand-care", "self-care"], "photo-1601049541289-9b1b7bbbfe19"],
      ["Daily Face Serum", 425000, "A lightweight serum for a simple, considered skincare routine.", "Sukoon", ["skincare", "serum", "daily"], "photo-1608571423902-eed4a5ad8108"],
      ["Reusable Makeup Bag", 295000, "A neat zip pouch for keeping daily essentials organized.", "Form Goods", ["pouch", "organizer", "travel"], "photo-1596462502278-27bfdc403348"],
      ["Soft Cotton Face Cloths", 165000, "A set of gentle cotton cloths for a simple daily cleanse.", "Sukoon", ["cotton", "bath", "self-care"], "photo-1600185365483-26d7a4cc7519"],
      ["Calming Bath Soak", 285000, "A mineral-rich bath soak for a quiet end to the day.", "Sukoon", ["bath", "relaxation", "wellness"], "photo-1540555700478-4be289fbecef"],
      ["Essential Oil Diffuser", 795000, "A quiet ultrasonic diffuser for soft fragrance at home.", "Luma Living", ["aromatherapy", "home", "wellness"], "photo-1602874801007-bd458bb1b8b6"],
      ["Satin Sleep Mask", 185000, "A smooth, comfortable sleep mask for restful evenings and travel.", "Sukoon", ["sleep", "travel", "comfort"], "photo-1511295742362-92c96b1b6a6a"],
      ["Gentle Body Lotion", 325000, "A daily body lotion with a light texture and soft scent.", "Sukoon", ["body-care", "skincare", "daily"], "photo-1556229010-6c3f2c9ca5f8"],
      ["Herbal Tea Gift Set", 395000, "A thoughtful selection of herbal blends for a slower tea break.", "Daybreak", ["tea", "gift", "wellness"], "photo-1544787219-7f47ccb76574"],
    ],
  },
];

const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const PRODUCT_COUNT = catalog.reduce((sum, group) => sum + group.products.length, 0);

async function getCloudImage(product) {
  const existing = await Product.findOne({ slug: product.slug }).select("images").lean();
  const seededImage = existing?.images?.find(({ publicId }) => publicId.startsWith("naqshcorner/seed/products/"));
  if (seededImage) return seededImage;

  const uploadOptions = {
    folder: "naqshcorner/seed/products",
    public_id: product.slug,
    overwrite: true,
    unique_filename: false,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  };

  let uploaded;
  try {
    uploaded = await cloudinary.uploader.upload(product.sourceUrl, uploadOptions);
  } catch (sourceError) {
    if (product.sourceUrl === image(FALLBACK_PHOTO_ID)) throw sourceError;
    console.warn(`Photo source unavailable for "${product.name}"; retrying with the verified fallback photo.`);
    uploaded = await cloudinary.uploader.upload(image(FALLBACK_PHOTO_ID), uploadOptions);
  }

  return {
    publicId: uploaded.public_id,
    secureUrl: uploaded.secure_url,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
    bytes: uploaded.bytes,
    altText: product.name,
    sortOrder: 0,
  };
}

async function seedProducts() {
  await connectDB();
  let productCount = 0;

  for (const group of catalog) {
    const category = await Category.findOneAndUpdate(
      { slug: group.category.slug },
      { $set: group.category },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    for (const [index, [name, priceMinor, description, brand, tags, photoId]] of group.products.entries()) {
      const slug = slugify(name);
      const item = {
        name,
        slug,
        sku: `NC-${group.category.slug.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
        description,
        shortDescription: description,
        category: category._id,
        brand,
        tags,
        priceMinor,
        discountPercent: index % 4 === 0 ? 10 : index % 4 === 1 ? 5 : 0,
        currency: "PKR",
        availablePieces: 8 + (index * 7) % 36,
        trackInventory: true,
        status: "published",
        sourceUrl: image(photoId),
      };
      const productImage = await getCloudImage(item);
      const { sourceUrl, ...product } = item;

      await Product.findOneAndUpdate(
        { slug },
        { $set: { ...product, images: [productImage] } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
      );
      productCount += 1;
      console.log(`Seeded ${productCount}/${PRODUCT_COUNT}: ${name}`);
    }
  }

  console.log(`Finished. Seeded ${productCount} products across ${catalog.length} categories.`);
}

seedProducts()
  .catch((error) => {
    console.error("Product seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
