"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useDarkMode } from "../../components/DarkModeProvider";
import { RainbowButton } from "../../components/magicui/rainbow-button";
import { ShimmerButton } from "../../components/magicui/shimmer-button";

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
  const [filter, setFilter] = useState({ category: "", type: "", price_type: "", condition: "", visibility: "", search: "" });
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [bidsOnMyProducts, setBidsOnMyProducts] = useState([]);
  const [loadingBids, setLoadingBids] = useState(true);
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
    if (filter.category) query = query.eq("category", filter.category);
    if (filter.type) query = query.eq("type", filter.type);
    if (filter.price_type) query = query.eq("price_type", filter.price_type);
    if (filter.condition) query = query.eq("condition", filter.condition);
    if (filter.visibility) query = query.eq("visibility", filter.visibility);
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-500">
      <div className="flex justify-end items-center p-6 gap-4">
        <button
          onClick={() => setDark((d) => !d)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Toggle dark mode"
        >
          {dark ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M21 12.79A9 9 0 0 1 12.21 3a7 7 0 1 0 8.79 9.79z" stroke="white" strokeWidth="2" fill="black" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="24" height="24">
              <circle cx="12" cy="12" r="5" stroke="black" strokeWidth="2" fill="white" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="black" strokeWidth="2" />
            </svg>
          )}
        </button>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 border-white dark:border-gray-800 transition-all duration-300">
          {getInitials(profile?.email)}
        </div>
        <ShimmerButton onClick={handleLogout} className="ml-2 px-4 py-2 text-black dark:text-white bg-red-500 rounded hover:bg-red-600 transition-colors shadow">
          Logout
        </ShimmerButton>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800 dark:text-white drop-shadow">Welcome</h1>
        {/* Notifications */}
        <div className="w-full max-w-2xl mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Notifications</h2>
          {loadingNotifications ? (
            <div className="text-gray-500 dark:text-gray-300">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-300">No notifications.</div>
          ) : (
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
          )}
        </div>
        {/* Bids on My Products */}
        <div className="w-full max-w-2xl mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Bids on Your Products</h2>
          {loadingBids ? (
            <div className="text-gray-500 dark:text-gray-300">Loading bids...</div>
          ) : bidsOnMyProducts.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-300">No bids on your products yet.</div>
          ) : (
            <ul className="space-y-2">
              {bidsOnMyProducts.map((bid) => (
                <li key={bid.id} className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded p-3 text-sm">
                  <span className="font-medium text-primary">Bid</span> of <span className="font-semibold">৳{bid.amount}</span> on <span className="font-semibold">{bid.products?.title || bid.product_id}</span> by <span className="font-semibold">{bid.students?.name || (bid.students?.email?.split("@")[0])}</span>.
                  <span className="block text-xs text-gray-400 mt-1">{new Date(bid.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Product Upload Form */}
        <form onSubmit={handleProductSubmit} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-full max-w-lg border border-gray-200 dark:border-gray-800 mb-10 space-y-4">
          <h2 className="text-xl font-semibold mb-2 text-center">Upload Product/Service</h2>
          <input name="title" type="text" placeholder="Title" value={form.title} onChange={handleFormChange} required className="border p-2 rounded w-full" />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleFormChange} className="border p-2 rounded w-full" />
          <div className="flex gap-2">
            <select name="category" value={form.category} onChange={handleFormChange} className="border p-2 rounded w-full">
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select name="type" value={form.type} onChange={handleFormChange} className="border p-2 rounded w-full">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleFormChange} className="border p-2 rounded w-full" min="0" step="0.01" />
            <select name="price_type" value={form.price_type} onChange={handleFormChange} className="border p-2 rounded w-full">
              {PRICE_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          </div>
          {form.type === "item" && (
            <select name="condition" value={form.condition} onChange={handleFormChange} className="border p-2 rounded w-full">
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select name="visibility" value={form.visibility} onChange={handleFormChange} className="border p-2 rounded w-full">
            {VISIBILITY.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <input name="image" type="file" accept="image/*" onChange={handleFormChange} className="border p-2 rounded w-full" />
          <RainbowButton type="submit" className="px-6 py-2 rounded font-medium mt-2 w-full text-white" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </RainbowButton>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">{success}</div>}
        </form>
        {/* Product Filters */}
        <div className="w-full max-w-3xl mb-6 flex flex-wrap gap-2 items-center justify-center">
          <input name="search" type="text" placeholder="Search..." value={filter.search} onChange={handleFilterChange} className="border p-2 rounded" />
          <select name="category" value={filter.category} onChange={handleFilterChange} className="border p-2 rounded">
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select name="type" value={filter.type} onChange={handleFilterChange} className="border p-2 rounded">
            <option value="">All Types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select name="price_type" value={filter.price_type} onChange={handleFilterChange} className="border p-2 rounded">
            <option value="">All Price Types</option>
            {PRICE_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
          </select>
          <select name="condition" value={filter.condition} onChange={handleFilterChange} className="border p-2 rounded">
            <option value="">All Conditions</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="visibility" value={filter.visibility} onChange={handleFilterChange} className="border p-2 rounded">
            <option value="">All Visibility</option>
            {VISIBILITY.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        {/* Product List */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {loadingProducts ? (
            <div className="col-span-full text-center text-lg text-gray-500 dark:text-gray-300">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center text-lg text-gray-500 dark:text-gray-300">No products found.</div>
          ) : (
            products.map((product) => (
              <a key={product.id} href={`/product/${product.id}`} className="block">
                <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg p-5 flex flex-col gap-2 border border-gray-200 dark:border-gray-800 transition-all hover:scale-[1.02] hover:shadow-2xl cursor-pointer">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.title} className="w-full h-40 object-cover rounded mb-2" />
                  )}
                  <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{product.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{product.description}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{product.category}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{product.type}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{product.price_type}</span>
                    {product.condition && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">{product.condition}</span>}
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{product.visibility}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold text-primary">{product.price ? `৳${product.price}` : "Free"}</span>
                    <span className="text-xs text-gray-500">{product.university}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(product.created_at).toLocaleString()}</div>
                  {(product.students?.name || product.students?.email) && (
                    <div className="text-xs text-gray-500 mt-1">Created by: <span className="font-medium">{product.students?.name || (product.students?.email?.split("@")[0])}</span></div>
                  )}
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 