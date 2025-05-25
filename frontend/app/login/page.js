"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";
import { useDarkMode } from "../../components/DarkModeProvider";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { dark, setDark } = useDarkMode();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        router.replace("/welcome");
      }
    });
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }
    setSuccess("Login successful!");
    setLoading(false);
    router.replace("/welcome");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full flex justify-end items-center p-4">
        <Switch checked={dark} onCheckedChange={setDark} className="mr-2" />
        {dark ? <Moon className="h-5 w-5 text-yellow-400" /> : <Sun className="h-5 w-5 text-yellow-500" />}
      </div>
      <Card className="max-w-md mx-auto mt-16 p-6">
        <CardContent>
          <h2 className="text-2xl font-bold mb-4">Login</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <Input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <Button type="submit" className="mt-2" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {success && <div className="text-green-600 mt-2">{success}</div>}
          </form>
          <div className="mt-4 text-center text-sm">
            New here?{' '}
            <a href="/register" className="text-blue-600 hover:underline">Register</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 