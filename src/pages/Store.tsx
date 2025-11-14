import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock products data (will be replaced with database)
const mockProducts = [
  { id: 1, name: "Laptop", price: 999.99, stock: 15, category: "Electronics", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400" },
  { id: 2, name: "Wireless Mouse", price: 29.99, stock: 50, category: "Electronics", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400" },
  { id: 3, name: "USB-C Cable", price: 12.99, stock: 100, category: "Accessories", image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400" },
  { id: 4, name: "Keyboard", price: 79.99, stock: 30, category: "Electronics", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400" },
  { id: 5, name: "Monitor", price: 349.99, stock: 20, category: "Electronics", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400" },
  { id: 6, name: "Headphones", price: 149.99, stock: 40, category: "Audio", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const Store = () => {
  const [products, setProducts] = useState(mockProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();

  const addToCart = (product: typeof mockProducts[0]) => {
    if (product.stock === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} added to your cart.`,
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Smart Retail Store</h1>
          <Button
            variant="outline"
            className="relative"
            onClick={() => setCartOpen(!cartOpen)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Cart
            {getTotalItems() > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-primary">
                    ${product.price}
                  </p>
                  <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Cart Sidebar */}
        {cartOpen && (
          <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-card border-l shadow-lg z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Shopping Cart</h2>
                <Button variant="ghost" onClick={() => setCartOpen(false)}>
                  ✕
                </Button>
              </div>

              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${item.price} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex items-center justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-primary">${getTotalPrice()}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" asChild>
                    <a href="/checkout">Proceed to Checkout</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Store;
