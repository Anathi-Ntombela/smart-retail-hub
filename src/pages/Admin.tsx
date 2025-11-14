import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

const productSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Product name must be at least 2 characters" })
    .max(100, { message: "Product name must be less than 100 characters" }),
  price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: "Price must be a valid number" }),
  stock: z.string()
    .regex(/^\d+$/, { message: "Stock must be a valid number" }),
  category: z.string()
    .trim()
    .min(2, { message: "Category must be at least 2 characters" })
    .max(50, { message: "Category must be less than 50 characters" }),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

const Admin = () => {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "Laptop", price: 999.99, stock: 15, category: "Electronics" },
    { id: 2, name: "Wireless Mouse", price: 29.99, stock: 50, category: "Electronics" },
    { id: 3, name: "USB-C Cable", price: 12.99, stock: 100, category: "Accessories" },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      stock: "",
      category: "",
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const newProduct: Product = {
        id: editingId || Date.now(),
        name: data.name,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        category: data.category,
      };

      if (editingId) {
        setProducts(products.map(p => p.id === editingId ? newProduct : p));
        toast({
          title: "Product Updated",
          description: "The product has been updated successfully.",
        });
      } else {
        setProducts([...products, newProduct]);
        toast({
          title: "Product Added",
          description: "The product has been added successfully.",
        });
      }

      form.reset();
      setEditingId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the product.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    form.setValue("name", product.name);
    form.setValue("price", product.price.toString());
    form.setValue("stock", product.stock.toString());
    form.setValue("category", product.category);
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    toast({
      title: "Product Deleted",
      description: "The product has been deleted successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Inventory Management System</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Product" : "Add New Product"}</CardTitle>
              <CardDescription>Manage your product inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Laptop" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input placeholder="999.99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input placeholder="15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Electronics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      <Plus className="mr-2 h-4 w-4" />
                      {editingId ? "Update" : "Add"} Product
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.reset();
                          setEditingId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>View and manage all products</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
