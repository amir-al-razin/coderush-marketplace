"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import ChatBox from "../../../components/ChatBox";

export default function SellerChats() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState({});

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
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <h1 className="text-2xl font-bold mb-6">Your Chats</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Chat Sessions</h2>
          <ul className="space-y-2">
            {chats.map((chat) => (
              <li key={chat.id} className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded p-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Product: {chat.products?.title || chat.product_id}</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">Buyer: {chat.buyers?.name || (chat.buyers?.email?.split("@")[0]) || chat.buyer_id}</span>
                  <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => { setSelectedChat(chat); setShowChat(true); }}>
                    Open Chat
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">Started: {new Date(chat.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {showChat && selectedChat && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <button className="float-right text-xl" onClick={() => setShowChat(false)}>✕</button>
              <div className="mb-2 font-semibold text-blue-700">Chat with: {buyerInfo.name || (buyerInfo.email?.split("@")[0]) || selectedChat.buyer_id}</div>
              <ChatBox chatId={selectedChat.id} currentUserId={user.id} open={showChat} buyerName={buyerInfo.name || (buyerInfo.email?.split("@")[0]) || selectedChat.buyer_id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 