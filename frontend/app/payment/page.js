"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "../../lib/supabaseClient";
import dynamic from "next/dynamic";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deal, setDeal] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function fetchDeal() {
      if (!dealId) return;
      const { data } = await supabase.from("deals").select("*").eq("id", dealId).single();
      setDeal(data);
    }
    fetchDeal();
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id));
  }, [dealId]);

  const handlePay = async () => {
    setLoading(true);
    await supabase.from("deals").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", dealId);
    setPaid(true);
    setLoading(false);
    // Refetch deal
    const { data } = await supabase.from("deals").select("*").eq("id", dealId).single();
    setDeal(data);
  };

  // Payment UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dummy Payment</CardTitle>
        </CardHeader>
        <CardContent>
          {paid || (deal && deal.status === "paid") ? (
            <div className="text-green-600 font-semibold text-center">
              Payment successful!<br />
              <Button className="mt-4 w-full" onClick={() => router.back()}>Continue</Button>
            </div>
          ) : userId === deal?.buyer_id ? (
            <Button className="w-full" onClick={handlePay} disabled={loading}>
              {loading ? "Processing..." : "Pay Now"}
            </Button>
          ) : (
            <div className="text-center text-muted-foreground">
              Waiting for buyer to pay...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 