"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Register() {
  const [form, setForm] = useState({
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
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="border p-2 rounded" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="border p-2 rounded" />
        <input name="university" type="text" placeholder="University" value={form.university} onChange={handleChange} required className="border p-2 rounded" />
        <input name="department" type="text" placeholder="Department" value={form.department} onChange={handleChange} className="border p-2 rounded" />
        <input name="program" type="text" placeholder="Program" value={form.program} onChange={handleChange} className="border p-2 rounded" />
        <input name="year_of_study" type="text" placeholder="Year of Study" value={form.year_of_study} onChange={handleChange} className="border p-2 rounded" />
        <input name="phone_number" type="text" placeholder="Phone Number" value={form.phone_number} onChange={handleChange} className="border p-2 rounded" />
        <input name="date_of_birth" type="date" placeholder="Date of Birth" value={form.date_of_birth} onChange={handleChange} className="border p-2 rounded" />
        <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded font-medium mt-2" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </form>
      <div className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">Login</a>
      </div>
    </div>
  );
} 