import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import { CategorySection } from "../ProductPage/ProductCard";
import { USER_PRODUCTS_API_END_POINT } from "../../utils/constant";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Add backend base URL - correct URL for accessing uploaded images
const BACKEND_URL = process.env.VITE_BACKEND_URL;

const categoriesData = [
  { id: 1, name: "Milk", icon: "🥛" },
  { id: 2, name: "Milk Products", icon: "🧈" },
  { id: 3, name: "Traditional Sweets", icon: "🍮" },
];

const ProductPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${BACKEND_URL}/api/v1/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setSubscriptions(response.data.data.subscriptions);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(USER_PRODUCTS_API_END_POINT, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Products API Response:', response.data);

      if (!response.data?.data?.products) {
        console.error('Invalid response format:', response.data);
        setProducts({}); // Set empty products object
        return;
      }

      const productsData = response.data.data.products;
      
      // Debug: Log all raw image paths from API
      console.log('Raw product images from API:', productsData.map(p => ({
        id: p.id || p._id,
        name: p.name,
        imagePaths: p.images
      })));

      // Group products by category
      const groupedProducts = productsData.reduce((acc, product) => {
        const categoryId = categoriesData.find(cat => cat.name === product.category)?.id;
        if (categoryId) {
          if (!acc[categoryId]) acc[categoryId] = [];
          
          // Process images to use the backend server URL
          const processedImages = product.images?.map(img => {
            // Debug: Log each image path before and after processing
            console.log(`Processing image path: "${img}"`);
            
            if (img && img.startsWith('/uploads/')) {
              const fullPath = `${BACKEND_URL}${img}`;
              console.log(`Converted to: "${fullPath}"`);
              return fullPath;
            }
            console.log(`Keeping original: "${img}"`);
            return img;
          }) || [];
          
          acc[categoryId].push({
            ...product,
            _id: product.id, // Map id to _id for consistency
            images: processedImages
          });
        }
        return acc;
      }, {});
      
      console.log('Grouped products with processed images:', groupedProducts);
      setProducts(groupedProducts);
    } catch (error) {
      console.error("Error fetching products:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.message);
      setProducts({}); // Set empty products object on error
      
      if (error.response) {
        toast.error(`Failed to load products: ${error.response.data?.message || 'Server error'}`);
      } else if (!error.response) {
        toast.error("Failed to load products: No response from server. Please make sure the backend server is running.");
      } else {
        toast.error(`Failed to load products: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchProducts} className="bg-blue-500 hover:bg-blue-600">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Check if there are any products in the selected category
  const hasProducts = products[selectedCategory]?.length > 0;

  // Add helper function to check if product is subscribed
  const isProductSubscribed = (productId) => {
    return subscriptions.some(sub => 
      sub.productId === productId && 
      (sub.status === 'active' || sub.status === 'pending_payment')
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Category Sidebar */}
          <div className="w-full md:w-1/4">
            <h2 className="text-xl font-bold mb-4">Categories</h2>
            <div className="space-y-2">
              {categoriesData.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full p-3 rounded-lg text-left ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="w-full md:w-3/4">
            {!hasProducts ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 p-8 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Products Available</h3>
                  <p className="text-gray-600 mb-4">
                    We're currently updating our product catalog. Please check back soon!
                  </p>
                </div>
              </div>
            ) : (
              <CategorySection
                category={categoriesData.find(cat => cat.id === selectedCategory)}
                products={products[selectedCategory] || []}
                isSubscribed={isProductSubscribed}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
