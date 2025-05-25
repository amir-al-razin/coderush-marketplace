"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";
import { useDarkMode } from "../../components/DarkModeProvider";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    department: "",
    program: "",
    year_of_study: "",
    phone_number: "",
    date_of_birth: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { dark, setDark } = useDarkMode();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    // Sign up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    // Get the user ID from the signUp response
    const user_id = data?.user?.id;
    // Insert student profile with user_id
    const { error: insertError } = await supabase.from("students").insert([
      {
        user_id,
        name: form.name,
        email: form.email,
        university: form.university,
        department: form.department,
        program: form.program,
        year_of_study: form.year_of_study,
        phone_number: form.phone_number,
        date_of_birth: form.date_of_birth,
      },
    ]);
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    setSuccess("Registration successful!");
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
          <h2 className="text-2xl font-bold mb-4">Register</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input name="name" type="text" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <Input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <Input name="university" type="text" placeholder="University" value={form.university} onChange={handleChange} required />
            <Input name="department" type="text" placeholder="Department" value={form.department} onChange={handleChange} />
            <Input name="program" type="text" placeholder="Program" value={form.program} onChange={handleChange} />
            <Input name="year_of_study" type="text" placeholder="Year of Study" value={form.year_of_study} onChange={handleChange} />
            <Input name="phone_number" type="text" placeholder="Phone Number" value={form.phone_number} onChange={handleChange} />
            <Input name="date_of_birth" type="date" placeholder="Date of Birth" value={form.date_of_birth} onChange={handleChange} />
            <Button type="submit" className="mt-2" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {success && <div className="text-green-600 mt-2">{success}</div>}
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">Login</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 