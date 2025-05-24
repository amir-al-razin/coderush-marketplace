import { useState } from "react";

export default function ReplyBox({ commentId, onReply }) {
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onReply(commentId, reply);
    setReply("");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 ml-4 flex flex-col gap-2">
      <textarea
        value={reply}
        onChange={e => setReply(e.target.value)}
        placeholder="Reply to this comment..."
        className="border rounded p-2 w-full min-h-[40px]"
        required
        disabled={submitting}
      />
      <button type="submit" className="self-end bg-blue-500 text-white px-4 py-1 rounded" disabled={submitting}>
        {submitting ? "Replying..." : "Reply"}
      </button>
    </form>
  );
} 