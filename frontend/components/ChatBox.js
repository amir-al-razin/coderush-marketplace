import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ChatBox({ chatId, currentUserId, open, buyerName, sellerName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages when chatId or open changes
  const fetchMessages = async () => {
    if (!chatId || !open) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("sent_at", { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((msgs) => {
            if (msgs.some(m => m.id === payload.new.id)) return msgs;
            return [...msgs, payload.new];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatId, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadImage = async (file) => {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${chatId}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('chat-images').upload(fileName, file);
    setUploading(false);
    if (error) {
      alert("Failed to upload image: " + error.message);
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from('chat-images').getPublicUrl(fileName);
    return publicUrlData?.publicUrl || null;
  };

  const sendMessage = async () => {
    if (!input.trim() && !image) return;
    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage(image);
      if (!imageUrl) return;
    }
    const messageObj = {
      chat_id: chatId,
      sender_id: currentUserId,
      content: input,
      sent_at: new Date().toISOString(),
      read: false,
      image_url: imageUrl,
    };
    setInput("");
    setImage(null);
    const { error } = await supabase.from("messages").insert(messageObj);
    if (error) {
      alert("Failed to send message: " + error.message);
      return;
    }
    fetchMessages();
  };

  return (
    <div className="flex flex-col h-96 border rounded p-2 bg-white">
      {(buyerName || sellerName) && (
        <div className="mb-2 font-semibold text-blue-700">
          {buyerName && <>Chat with: {buyerName}</>}
          {sellerName && <>Chat with: {sellerName}</>}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.sender_id === currentUserId ? "text-right" : "text-left"}>
            <span className={msg.sender_id === currentUserId ? "text-blue-600" : "text-green-600"}>
              {msg.content && <span>{msg.content}</span>}
              {msg.image_url && (
                <div className="mt-2">
                  <img src={msg.image_url} alt="chat-img" className="inline-block max-w-xs max-h-40 rounded border" />
                </div>
              )}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 mt-2 items-center">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          disabled={uploading}
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0])}
          disabled={uploading}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={sendMessage} disabled={uploading}>
          {uploading ? "Uploading..." : "Send"}
        </button>
      </div>
    </div>
  );
} 