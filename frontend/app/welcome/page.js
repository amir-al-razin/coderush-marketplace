"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useDarkMode } from "../../components/DarkModeProvider";
import { RainbowButton } from "../../components/magicui/rainbow-button";
import { ShimmerButton } from "../../components/magicui/shimmer-button";
import ChatModal from "../../components/ChatModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Bell, ShoppingBag, Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InteractiveHoverButton } from "../../components/magicui/interactive-hover-button";

const CATEGORIES = ["Textbook", "Gadget", "Clothing", "Furniture", "Service", "Other"];
const CONDITIONS = ["new", "like new", "good", "fair", "poor"];
const PRICE_TYPES = ["fixed", "bidding", "hourly"];
const TYPES = ["item", "service"];
const VISIBILITY = ["university", "department", "batch", "all"];

export default function Welcome() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Textbook",
    type: "item",
    price: "",
    price_type: "fixed",
    condition: "good",
    visibility: "university",
    image: null,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState({ 
    category: "all", 
    type: "all", 
    price_type: "all", 
    condition: "all", 
    visibility: "all", 
    search: "" 
  });
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [bidsOnMyProducts, setBidsOnMyProducts] = useState([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [showBidsDialog, setShowBidsDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const router = useRouter();
  const { dark, setDark } = useDarkMode();

  useEffect(() => {
    async function fetchUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from("students")
          .select("user_id, email, university, department, program, year_of_study, phone_number, date_of_birth")
          .eq("user_id", user.id)
          .single();
        if (!error) setProfile(data);
      }
    }
    fetchUserAndProfile();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  useEffect(() => {
    async function fetchNotifications() {
      setLoadingNotifications(true);
      if (!user) return;
      const { data, error } = await supabase
        .from("notifications")
        .select("*",)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) setNotifications(data || []);
      setLoadingNotifications(false);
    }
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    async function fetchBidsOnMyProducts() {
      setLoadingBids(true);
      if (!user) return;
      // 1. Get all product ids where user is uploader
      const { data: myProducts, error: prodError } = await supabase
        .from("products")
        .select("id, title")
        .eq("user_id", user.id);
      if (prodError || !myProducts || myProducts.length === 0) {
        setBidsOnMyProducts([]);
        setLoadingBids(false);
        return;
      }
      const productIds = myProducts.map(p => p.id);
      // 2. Get all bids for those products, join with product title and bidder info
      const { data: bids, error: bidsError } = await supabase
        .from("bids")
        .select("id, amount, created_at, product_id, students:user_id(name,email), products:product_id(title)")
        .in("product_id", productIds)
        .order("created_at", { ascending: false });
      if (!bidsError && bids) {
        setBidsOnMyProducts(bids);
      } else {
        setBidsOnMyProducts([]);
      }
      setLoadingBids(false);
    }
    if (user) fetchBidsOnMyProducts();
  }, [user]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    let query = supabase
      .from("products")
      .select("*, students: user_id (name, email)", { count: "exact" });
    if (filter.category && filter.category !== "all") query = query.eq("category", filter.category);
    if (filter.type && filter.type !== "all") query = query.eq("type", filter.type);
    if (filter.price_type && filter.price_type !== "all") query = query.eq("price_type", filter.price_type);
    if (filter.condition && filter.condition !== "all") query = query.eq("condition", filter.condition);
    if (filter.visibility && filter.visibility !== "all") query = query.eq("visibility", filter.visibility);
    if (filter.search) query = query.ilike("title", `%${filter.search}%`);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (!error) setProducts(data || []);
    setLoadingProducts(false);
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((f) => ({ ...f, image: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((f) => ({ ...f, [name]: value }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploading(true);
    let image_url = null;
    if (form.image) {
      const fileExt = form.image.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from("product-images").upload(fileName, form.image);
      if (uploadError) {
        setError("Image upload failed");
        setUploading(false);
        return;
      }
      image_url = supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl;
    }
    const { error: insertError } = await supabase.from("products").insert([
      {
        user_id: profile.user_id,
        title: form.title,
        description: form.description,
        category: form.category,
        type: form.type,
        price: form.price ? parseFloat(form.price) : null,
        price_type: form.price_type,
        condition: form.type === "item" ? form.condition : null,
        image_url,
        visibility: form.visibility,
        university: profile.university,
        department: profile.department,
        batch: profile.year_of_study,
      },
    ]);
    if (insertError) {
      setError(insertError.message);
      setUploading(false);
      return;
    }
    setSuccess("Product uploaded successfully!");
    setForm({
      title: "",
      description: "",
      category: "Textbook",
      type: "item",
      price: "",
      price_type: "fixed",
      condition: "good",
      visibility: "university",
      image: null,
    });
    setUploading(false);
    fetchProducts();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // Helper for profile initials
  const getInitials = (email) => {
    if (!email) return "?";
    const [name] = email.split("@");
    return name
      .split(/[._-]/)
      .map((n) => n[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col min-h-screen">
        <div className="flex justify-between items-center p-6 gap-4 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <Switch
              checked={dark}
              onCheckedChange={setDark}
              className="data-[state=checked]:bg-slate-900"
            />
            <Moon className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowNotifDialog(true)} aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowBidsDialog(true)} aria-label="Bids">
              <ShoppingBag className="h-5 w-5" />
            </Button>
            <Button onClick={() => setShowUploadDialog(true)} variant="default" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Upload Product/Service
            </Button>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Avatar onClick={() => setShowUserDialog(true)} className="cursor-pointer border-2 border-primary">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.name || profile?.email} />
                  <AvatarFallback>{getInitials(profile?.email)}</AvatarFallback>
                </Avatar>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>User Info</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <div><span className="font-semibold">Name:</span> {profile?.name || "-"}</div>
                  <div><span className="font-semibold">Email:</span> {profile?.email || "-"}</div>
                  <div><span className="font-semibold">University:</span> {profile?.university || "-"}</div>
                  <div><span className="font-semibold">Department:</span> {profile?.department || "-"}</div>
                  <div><span className="font-semibold">Program:</span> {profile?.program || "-"}</div>
                  <div><span className="font-semibold">Year of Study:</span> {profile?.year_of_study || "-"}</div>
                  <div><span className="font-semibold">Phone:</span> {profile?.phone_number || "-"}</div>
                  <div><span className="font-semibold">Date of Birth:</span> {profile?.date_of_birth || "-"}</div>
                </div>
                <Button onClick={handleLogout} variant="destructive" className="mt-4 w-full">Logout</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Dialogs for Notifications, Bids, Upload Form */}
        <Dialog open={showNotifDialog} onOpenChange={setShowNotifDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Notifications</DialogTitle></DialogHeader>
            {loadingNotifications ? (
              <div className="text-gray-500 dark:text-gray-300">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-300">No notifications.</div>
            ) : (
              <ScrollArea className="h-[300px]">
                <ul className="space-y-2">
                  {notifications.map((notif) => (
                    <li key={notif.id} className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded p-3 text-sm">
                      {notif.type === "bid" && notif.data ? (
                        <>
                          <span className="font-medium text-primary">New bid</span> on product <span className="font-semibold">{notif.data.product_id}</span> for <span className="font-semibold">৳{notif.data.amount}</span> by user <span className="font-semibold">{notif.data.bidder_id}</span>.
                          <span className="block text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</span>
                        </>
                      ) : (
                        <span>Unknown notification</span>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={showBidsDialog} onOpenChange={setShowBidsDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Bids on Your Products</DialogTitle></DialogHeader>
            {loadingBids ? (
              <div className="text-gray-500 dark:text-gray-300">Loading bids...</div>
            ) : bidsOnMyProducts.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-300">No bids on your products yet.</div>
            ) : (
              <ScrollArea className="h-[300px]">
                <ul className="space-y-2">
                  {bidsOnMyProducts.map((bid) => (
                    <li key={bid.id} className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded p-3 text-sm">
                      <span className="font-medium text-primary">Bid</span> of <span className="font-semibold">৳{bid.amount}</span> on <span className="font-semibold">{bid.products?.title || bid.product_id}</span> by <span className="font-semibold">{bid.students?.name || (bid.students?.email?.split("@")[0])}</span>.
                      <span className="block text-xs text-gray-400 mt-1">{new Date(bid.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Upload Product/Service</DialogTitle></DialogHeader>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" type="text" value={form.title} onChange={handleFormChange} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={form.description} onChange={handleFormChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" value={form.category} onValueChange={(value) => handleFormChange({ target: { name: 'category', value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" value={form.type} onValueChange={(value) => handleFormChange({ target: { name: 'type', value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" value={form.price} onChange={handleFormChange} min="0" step="0.01" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_type">Price Type</Label>
                  <Select name="price_type" value={form.price_type} onValueChange={(value) => handleFormChange({ target: { name: 'price_type', value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select price type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_TYPES.map((pt) => (
                        <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.type === "item" && (
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select name="condition" value={form.condition} onValueChange={(value) => handleFormChange({ target: { name: 'condition', value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select name="visibility" value={form.visibility} onValueChange={(value) => handleFormChange({ target: { name: 'visibility', value } })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input id="image" name="image" type="file" accept="image/*" onChange={handleFormChange} />
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              {error && <div className="text-red-600 mt-2">{error}</div>}
              {success && <div className="text-green-600 mt-2">{success}</div>}
            </form>
          </DialogContent>
        </Dialog>
        {/* Search and Filters Row */}
        <Card className="w-full max-w-5xl mx-auto mt-8 mb-8 shadow-lg">
          <CardContent className="p-6 flex flex-wrap gap-4 items-center justify-center">
            <Input name="search" type="text" placeholder="Search..." value={filter.search} onChange={handleFilterChange} className="flex-1 min-w-[200px]" />
            
            <Select name="category" value={filter.category} onValueChange={(value) => handleFilterChange({ target: { name: 'category', value } })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select name="type" value={filter.type} onValueChange={(value) => handleFilterChange({ target: { name: 'type', value } })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select name="price_type" value={filter.price_type} onValueChange={(value) => handleFilterChange({ target: { name: 'price_type', value } })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Price Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Price Types</SelectItem>
                {PRICE_TYPES.map((pt) => (
                  <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select name="condition" value={filter.condition} onValueChange={(value) => handleFilterChange({ target: { name: 'condition', value } })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select name="visibility" value={filter.visibility} onValueChange={(value) => handleFilterChange({ target: { name: 'visibility', value } })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                {VISIBILITY.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        {/* Product List */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {loadingProducts ? (
            <div className="col-span-full text-center text-lg text-gray-500 dark:text-gray-300">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center text-lg text-gray-500 dark:text-gray-300">No products found.</div>
          ) : (
            products.map((product) => (
              <a key={product.id} href={`/product/${product.id}`} className="block">
                <Card className="h-full hover:scale-[1.02] transition-all duration-200">
                  <CardContent className="p-5">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.title} className="w-full h-40 object-cover rounded mb-2" />
                    )}
                    <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{product.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{product.description}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{product.category}</Badge>
                      <Badge variant="secondary">{product.type}</Badge>
                      <Badge variant="secondary">{product.price_type}</Badge>
                      {product.condition && <Badge variant="secondary">{product.condition}</Badge>}
                      <Badge variant="secondary">{product.visibility}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-semibold text-primary">{product.price ? `৳${product.price}` : "Free"}</span>
                      <span className="text-xs text-gray-500">{product.university}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(product.created_at).toLocaleString()}</div>
                    {(product.students?.name || product.students?.email) && (
                      <div className="text-xs text-gray-500 mt-1">Created by: <span className="font-medium">{product.students?.name || (product.students?.email?.split("@")[0])}</span></div>
                    )}
                  </CardContent>
                </Card>
              </a>
            ))
          )}
        </div>
        {/* Floating Chat Button */}
        <InteractiveHoverButton
          className="fixed bottom-8 right-8 px-6 py-3 rounded-full shadow-lg z-50"
          onClick={() => setChatOpen(true)}
        >
          Chat with Price Advisor
        </InteractiveHoverButton>
        <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </div>
  );
} 