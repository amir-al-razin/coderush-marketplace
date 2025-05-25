"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import ChatBox from "../../../components/ChatBox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";
import { useDarkMode } from "../../../components/DarkModeProvider";

export default function SellerChats() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState({});
  const { dark, setDark } = useDarkMode();

  useEffect(() => {
    async function fetchUserAndChats() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: chatData } = await supabase
          .from("chats")
          .select("*, products(title), buyers:buyer_id(name,email)")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false });
        setChats(chatData || []);
      }
    }
    fetchUserAndChats();
  }, []);

  // Fetch buyer info for selected chat
  useEffect(() => {
    async function fetchBuyer() {
      if (selectedChat && selectedChat.buyer_id) {
        const { data } = await supabase
          .from("students")
          .select("name,email")
          .eq("user_id", selectedChat.buyer_id)
          .single();
        setBuyerInfo(data || {});
      } else {
        setBuyerInfo({});
      }
    }
    fetchBuyer();
  }, [selectedChat]);

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="w-full flex justify-end items-center mb-4">
        <Switch checked={dark} onCheckedChange={setDark} className="mr-2" />
        {dark ? <Moon className="h-5 w-5 text-yellow-400" /> : <Sun className="h-5 w-5 text-yellow-500" />}
      </div>
      <h1 className="text-2xl font-bold mb-6">Your Chats</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Chat Sessions</h2>
          <ul className="space-y-2">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-lg border border-muted bg-card text-card-foreground"
                  onClick={() => { setSelectedChat(chat); setShowChat(true); }}
                >
                  <CardContent className="py-4 px-5 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">Product: {chat.products?.title || chat.product_id}</span>
                      <span className="ml-2 text-sm text-muted-foreground">Buyer: {chat.buyers?.name || (chat.buyers?.email?.split("@")?.[0]) || chat.buyer_id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Started: {new Date(chat.created_at).toLocaleString()}</div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Dialog open={showChat && selectedChat} onOpenChange={setShowChat}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  Chat with: {buyerInfo.name || (buyerInfo.email?.split("@")?.[0]) || selectedChat?.buyer_id}
                  <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              {showChat && selectedChat && (
                <ChatBox 
                  chatId={selectedChat.id} 
                  currentUserId={user.id} 
                  open={showChat} 
                  sellerName={buyerInfo.name || (buyerInfo.email?.split("@")?.[0]) || selectedChat.buyer_id}
                  buyerId={selectedChat.buyer_id}
                  sellerId={selectedChat.seller_id}
                  productId={selectedChat.product_id}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 