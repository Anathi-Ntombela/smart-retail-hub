import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Package, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Smart Retail System</h1>
          <p className="text-muted-foreground">Complete E-Commerce & Inventory Management</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome to Smart Retail System</h2>
          <p className="text-xl text-muted-foreground mb-8">
            A comprehensive retail management solution with customer portal and admin dashboard
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/store">Browse Store</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/register">Register</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/login">Login</a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="/admin">Admin Dashboard</a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <ShoppingCart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>Browse and purchase products with real-time stock updates</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>User Management</CardTitle>
              <CardDescription>Secure registration and authentication system</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Package className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Order Processing</CardTitle>
              <CardDescription>Complete checkout with payment processing</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Admin panel for managing products and stock</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-2xl">System Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Customer registration with secure password validation</li>
              <li>✓ Product browsing with categories and search</li>
              <li>✓ Shopping cart with real-time updates</li>
              <li>✓ Secure checkout and order processing</li>
              <li>✓ Payment processing with multiple methods</li>
              <li>✓ Admin dashboard for inventory management</li>
              <li>✓ CRUD operations for products</li>
              <li>✓ Input validation and security measures</li>
              <li>✓ Responsive design for all devices</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
