import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ImagePlus, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

export default function ChatBox({ chatId, currentUserId, open, sellerName, buyerId, sellerId, productId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const subscriptionRef = useRef(null);
  const router = useRouter();
  const [deal, setDeal] = useState(null);
  const [dealLoading, setDealLoading] = useState(false);

  useEffect(() => {
    if (open && chatId) {
      fetchMessages();
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      const channel = supabase
        .channel(`chat:${chatId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
          (payload) => {
            setMessages((prev) => {
              // Prevent duplicate messages
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            setTimeout(() => {
              scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        )
        .subscribe();
      subscriptionRef.current = channel;
      return () => {
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
        }
      };
    }
  }, [chatId, open]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("sent_at", { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(data || []);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      console.log("Fetched messages:", data);
    } catch (err) {
      console.error("Error in fetchMessages:", err);
    }
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${chatId}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("chat-images")
        .upload(fileName, file);
      if (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image: " + error.message);
        return null;
      }
      const { data: publicUrlData } = supabase.storage
        .from("chat-images")
        .getPublicUrl(fileName);
      console.log("Image uploaded, public URL:", publicUrlData?.publicUrl);
      return publicUrlData?.publicUrl || null;
    } catch (err) {
      console.error("Error in uploadImage:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !image) return;
    try {
      setLoading(true);
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }
      const { error } = await supabase.from("messages").insert([
        {
          chat_id: chatId,
          sender_id: currentUserId,
          content: newMessage.trim(),
          image_url: imageUrl,
          sent_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
        return;
      }
      setNewMessage("");
      setImage(null);
      // Refetch messages to ensure UI is up to date
      fetchMessages();
    } catch (err) {
      console.error("Error in sendMessage:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  // Debug: log messages on every render
  useEffect(() => {
    console.log("Current messages:", messages);
  }, [messages]);

  // Fetch latest deal for this chat
  useEffect(() => {
    async function fetchDeal() {
      if (!chatId) return;
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) setDeal(data[0]);
      else setDeal(null);
    }
    fetchDeal();
  }, [chatId]);

  // Send deal request (either party)
  const sendDealRequest = async () => {
    setDealLoading(true);
    const { data, error } = await supabase.from("deals").insert([
      {
        chat_id: chatId,
        buyer_id: buyerId,
        seller_id: sellerId,
        product_id: productId,
        status: "pending",
        requested_by: currentUserId,
      },
    ]).select();
    if (!error && data && data.length > 0) setDeal(data[0]);
    setDealLoading(false);
  };

  // Accept deal
  const acceptDeal = async () => {
    setDealLoading(true);
    await supabase.from("deals").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", deal.id);
    setDeal({ ...deal, status: "accepted" });
    setDealLoading(false);
  };

  // Reject deal
  const rejectDeal = async () => {
    setDealLoading(true);
    await supabase.from("deals").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", deal.id);
    setDeal({ ...deal, status: "rejected" });
    setDealLoading(false);
  };

  // Mark as paid
  const markAsPaid = async () => {
    setDealLoading(true);
    await supabase.from("deals").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", deal.id);
    setDeal({ ...deal, status: "paid" });
    setDealLoading(false);
  };

  // Dummy payment redirect
  const goToPayment = () => {
    router.push(`/payment?dealId=${deal.id}`);
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Deal request UI */}
      <div className="p-2">
        {deal ? (
          <div className="mb-2">
            <div className="text-sm font-semibold">Deal status: <span className="capitalize">{deal.status}</span></div>
            {/* Existing deal status logic */}
            {deal.status === "pending" && deal.requested_by !== currentUserId && (
              <div className="flex gap-2 mt-1">
                <Button size="sm" onClick={acceptDeal} disabled={dealLoading}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={rejectDeal} disabled={dealLoading}>Reject</Button>
              </div>
            )}
            {deal.status === "pending" && deal.requested_by === currentUserId && (
              <div className="text-xs text-muted-foreground">Waiting for other party to accept/reject...</div>
            )}
            {deal.status === "accepted" && (
              <Button size="sm" className="mt-2" onClick={goToPayment} disabled={dealLoading}>Proceed to Payment</Button>
            )}
            {deal.status === "rejected" && (
              <div className="text-xs text-red-500 mt-1">Deal was rejected.</div>
            )}
            {deal.status === "paid" && (
              <div className="text-xs text-green-600 mt-1">Payment complete. Deal closed.</div>
            )}
          </div>
        ) : (
          <Button size="sm" onClick={sendDealRequest} disabled={dealLoading}>Request Deal</Button>
        )}
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <Card className={`max-w-[80%] ${message.sender_id === currentUserId ? "bg-primary text-primary-foreground" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {message.sender_id === currentUserId ? "You" : sellerName?.[0] || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {message.sender_id === currentUserId ? "You" : sellerName || "Seller"}
                      </div>
                      {message.content && (
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      )}
                      {message.image_url && (
                        <div className="mt-2">
                          <img
                            src={message.image_url}
                            alt="Shared image"
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                            onError={(e) => {
                              console.error("Error loading image:", e);
                              e.target.src = "https://via.placeholder.com/200x200?text=Image+Error";
                            }}
                          />
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.sent_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <Separator />
      <form onSubmit={sendMessage} className="p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || uploading}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploading}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload image</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button type="submit" disabled={loading || uploading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {image && (
          <div className="mt-2 flex items-center gap-2">
            <img
              src={URL.createObjectURL(image)}
              alt="Selected"
              className="h-10 w-10 object-cover rounded"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setImage(null)}
              disabled={loading || uploading}
            >
              Remove
            </Button>
          </div>
        )}
      </form>
    </div>
  );
} 