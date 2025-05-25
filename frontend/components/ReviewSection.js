import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function ReviewSection({ productId, currentUserId, revieweeId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      setReviews(data || []);
    };
    fetchReviews();
  }, [productId]);

  const submitReview = async () => {
    await supabase.from("reviews").insert({
      product_id: productId,
      reviewer_id: currentUserId,
      reviewee_id: revieweeId,
      rating,
      content,
    });
    setContent("");
    setRating(5);
    // Refresh reviews
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    setReviews(data || []);
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        {reviews.length === 0 && <div className="text-muted-foreground">No reviews yet.</div>}
        {reviews.map((r) => (
          <Card key={r.id} className="mb-2">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">{r.rating}★</Badge>
                <span className="text-sm text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <div className="text-base text-foreground">{r.content}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <Label className="font-semibold mb-1 block">Leave a Review</Label>
        <div className="flex items-center gap-3 mb-3">
          <Label htmlFor="rating">Rating</Label>
          <Select value={String(rating)} onValueChange={v => setRating(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5].map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your review..."
          className="mb-3"
        />
        <Button onClick={submitReview} className="w-full">Submit</Button>
      </div>
    </div>
  );
} 