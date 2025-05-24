"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import ChatBox from "../../../components/ChatBox";
import ReviewSection from "../../../components/ReviewSection";
import ReplyBox from "../../../components/ReplyBox";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [bidError, setBidError] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");
  const [chatId, setChatId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [sellerInfo, setSellerInfo] = useState({});

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (!error) setProduct(data);
      setLoading(false);
    }
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    async function fetchComments() {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from("comments")
        .select("*, students:user_id(name,email)")
        .eq("product_id", id)
        .order("created_at", { ascending: true });
      if (!error) setComments(data || []);
      setLoadingComments(false);
    }
    if (id) fetchProduct();
    fetchUser();
    if (id) fetchComments();
  }, [id]);

  useEffect(() => {
    async function fetchSeller() {
      if (product && product.user_id) {
        const { data } = await supabase
          .from("students")
          .select("name,email")
          .eq("user_id", product.user_id)
          .single();
        setSellerInfo(data || {});
      } else {
        setSellerInfo({});
      }
    }
    if (product && product.user_id) fetchSeller();
  }, [product]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError("");
    setBidSuccess("");
    if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) {
      setBidError("Enter a valid bid amount.");
      return;
    }
    const { error } = await supabase.from("bids").insert([
      {
        product_id: product.id,
        user_id: user.id,
        amount: Number(bidAmount),
      },
    ]);
    if (error) {
      setBidError(error.message);
      return;
    }
    if (product.user_id !== user.id) {
      await supabase.from("notifications").insert([
        {
          user_id: product.user_id,
          type: "bid",
          data: {
            product_id: product.id,
            bidder_id: user.id,
            amount: Number(bidAmount),
          },
        },
      ]);
    }
    setBidSuccess("Bid placed successfully!");
    setBidAmount("");
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setCommentError("");
    setCommentSuccess("");
    if (!commentInput.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    const { error } = await supabase.from("comments").insert([
      {
        product_id: id,
        user_id: user.id,
        content: commentInput.trim(),
      },
    ]);
    if (error) {
      setCommentError(error.message);
      return;
    }
    setCommentSuccess("Comment posted!");
    setCommentInput("");
    // Refresh comments
    const { data, error: fetchError } = await supabase
      .from("comments")
      .select("*, students:user_id(name,email)")
      .eq("product_id", id)
      .order("created_at", { ascending: true });
    if (!fetchError) setComments(data || []);
  };

  const startChat = async () => {
    if (!user || !product) return;
    // Check for existing chat
    let { data: chat, error: fetchError } = await supabase
      .from("chats")
      .select("*")
      .eq("buyer_id", user.id)
      .eq("seller_id", product.user_id)
      .eq("product_id", product.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      alert("Failed to fetch chat: " + fetchError.message);
      return;
    }

    if (!chat) {
      // Create new chat
      const { data: newChat, error: insertError } = await supabase
        .from("chats")
        .insert({
          buyer_id: user.id,
          seller_id: product.user_id,
          product_id: product.id,
        })
        .select()
        .single();
      if (insertError || !newChat) {
        alert("Failed to create chat: " + (insertError?.message || "Unknown error"));
        return;
      }
      chat = newChat;
    }

    if (!chat || !chat.id) {
      alert("Could not start chat. Please try again.");
      return;
    }
    setChatId(chat.id);
    setShowChat(true);
  };

  const handleReply = async (commentId, replyText) => {
    if (!replyText.trim()) return;
    const { error } = await supabase.from("comments").update({ reply: replyText, replied_at: new Date().toISOString() }).eq("id", commentId);
    if (error) {
      alert("Failed to save reply: " + error.message);
      return;
    }
    // Refresh comments
    const { data, error: fetchError } = await supabase
      .from("comments")
      .select("*, students:user_id(name,email)")
      .eq("product_id", id)
      .order("created_at", { ascending: true });
    if (!fetchError) setComments(data || []);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
  if (!product) return <div className="flex items-center justify-center min-h-screen text-lg text-red-500">Product not found.</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-500 p-6">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-2xl rounded-2xl p-8 w-full max-w-xl border border-gray-200 dark:border-gray-800 mt-10">
        {product.image_url && (
          <img src={product.image_url} alt={product.title} className="w-full h-64 object-cover rounded mb-4" />
        )}
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">{product.title}</h1>
        <div className="text-md text-gray-600 dark:text-gray-300 mb-4">{product.description}</div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{product.category}</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{product.type}</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{product.price_type}</span>
          {product.condition && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">{product.condition}</span>}
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{product.visibility}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold text-primary text-lg">{product.price ? `৳${product.price}` : "Free"}</span>
          <span className="text-xs text-gray-500">{product.university}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">{new Date(product.created_at).toLocaleString()}</div>
      </div>
      {/* Bidding Feature */}
      {product.price_type === "bidding" && user && (
        product.user_id === user.id ? (
          <div className="mt-6 text-center text-yellow-600 font-medium">You are the uploader. You cannot bid on your own product.</div>
        ) : (
          <form onSubmit={handleBidSubmit} className="mt-6 flex flex-col items-center gap-3">
            <input
              type="number"
              min="1"
              step="0.01"
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              placeholder="Enter your bid amount"
              className="border p-2 rounded w-64"
              required
            />
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded font-medium">Place Bid</button>
            {bidError && <div className="text-red-600">{bidError}</div>}
            {bidSuccess && <div className="text-green-600">{bidSuccess}</div>}
          </form>
        )
      )}
      {user && product && user.id !== product.user_id && (
        <>
          <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded" onClick={startChat}>
            Chat with Seller
          </button>
          {showChat && chatId && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 relative">
                <button className="absolute top-2 right-2 text-xl" onClick={() => setShowChat(false)}>✕</button>
                <ChatBox chatId={chatId} currentUserId={user.id} open={showChat} sellerName={sellerInfo.name || (sellerInfo.email?.split("@")[0]) || product.user_id} />
              </div>
            </div>
          )}
        </>
      )}
      {/* Seller chat management link */}
      {user && product && user.id === product.user_id && (
        <div className="mt-4">
          <a href="/seller/chats" className="text-blue-600 underline">Manage All Chats</a>
        </div>
      )}
      {/* Comments Section */}
      <div className="w-full max-w-xl mt-10">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Comments</h2>
        {loadingComments ? (
          <div className="text-gray-500 dark:text-gray-300">Loading comments...</div>
        ) : (
          <ul className="space-y-3 mb-4">
            {comments.map((c) => (
              <li key={c.id} className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded p-3 flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{c.students?.name || (c.students?.email?.split("@")[0]) || "User"}</span>
                  {product && c.user_id === product.user_id && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">Seller</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="text-gray-800 dark:text-gray-100">{c.content}</div>
                {/* Reply section */}
                {c.reply && (
                  <div className="mt-2 ml-4 p-2 bg-blue-50 dark:bg-blue-900 rounded">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">Seller Reply:</span> {c.reply}
                    <span className="block text-xs text-gray-400 mt-1">{c.replied_at ? new Date(c.replied_at).toLocaleString() : ""}</span>
                  </div>
                )}
                {/* Only uploader can reply, and only if not already replied */}
                {user && product && user.id === product.user_id && !c.reply && (
                  <ReplyBox commentId={c.id} onReply={handleReply} />
                )}
              </li>
            ))}
          </ul>
        )}
        {user && (
          <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
            <textarea
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Add a comment..."
              className="border p-2 rounded w-full min-h-[60px]"
              required
            />
            <button type="submit" className="self-end bg-primary text-primary-foreground px-4 py-1.5 rounded font-medium">Post</button>
            {commentError && <div className="text-red-600 text-sm">{commentError}</div>}
            {commentSuccess && <div className="text-green-600 text-sm">{commentSuccess}</div>}
          </form>
        )}
      </div>
      <ReviewSection productId={product.id} currentUserId={user?.id} revieweeId={product.user_id} />
    </div>
  );
} 