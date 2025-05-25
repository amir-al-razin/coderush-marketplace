import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function ChatModal({ open, onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {role: "user"|"advisor", text: string}
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("http://192.168.152.82:8000/chat/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: "advisor", text: data.response }]);
    } catch (e) {
      setMessages((msgs) => [...msgs, { role: "advisor", text: "Sorry, there was an error." }]);
    }
    setInput("");
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Chat with Price Advisor
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
                  <span className={msg.role === "user" ? "font-semibold text-primary" : "font-semibold text-green-700"}>
                    {msg.role === "user" ? "You" : "Advisor"}:
                  </span>{" "}
                  <span>{msg.text}</span>
                </div>
              ))}
              {loading && <div className="text-left text-gray-400">Advisor is typing...</div>}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>Send</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
