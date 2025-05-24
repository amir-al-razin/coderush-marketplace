import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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
    <div className="w-full max-w-xl mt-10">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Reviews</h3>
      {reviews.map((r) => (
        <div key={r.id} className="border-b py-2">
          <div>Rating: {r.rating} / 5</div>
          <div>{r.content}</div>
        </div>
      ))}
      <div className="mt-4">
        <h4 className="font-semibold">Leave a Review</h4>
        <select value={rating} onChange={e => setRating(Number(e.target.value))} className="border rounded p-1">
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your review..."
          className="border rounded p-2 w-full min-h-[60px] mt-2"
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded mt-2" onClick={submitReview}>
          Submit
        </button>
      </div>
    </div>
  );
} 