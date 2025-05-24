"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useDarkMode } from "../../components/DarkModeProvider";

export default function Welcome() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const router = useRouter();
  const { dark, setDark } = useDarkMode();

  useEffect(() => {
    async function fetchUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from("students")
          .select("email, university, department, program, year_of_study, phone_number, date_of_birth")
          .eq("user_id", user.id)
          .single();
        if (!error) setProfile(data);
      }
    }
    fetchUserAndProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-end items-center p-6 gap-4">
        <button
          onClick={() => setDark((d) => !d)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Toggle dark mode"
        >
          {dark ? (
            // Moon icon for dark mode
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M21 12.79A9 9 0 0 1 12.21 3a7 7 0 1 0 8.79 9.79z" stroke="white" strokeWidth="2" fill="black" />
            </svg>
          ) : (
            // Sun icon for light mode
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="24" height="24">
              <circle cx="12" cy="12" r="5" stroke="black" strokeWidth="2" fill="white" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="black" strokeWidth="2" />
            </svg>
          )}
        </button>
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
          <span role="img" aria-label="profile">👤</span>
        </div>
        <button onClick={handleLogout} className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">Logout</button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-6">Welcome</h1>
        {profile ? (
          <div className="bg-white dark:bg-gray-900 shadow rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
            <div className="space-y-2">
              <div><span className="font-medium">Email:</span> {profile.email}</div>
              <div><span className="font-medium">University:</span> {profile.university}</div>
              <div><span className="font-medium">Department:</span> {profile.department}</div>
              <div><span className="font-medium">Program:</span> {profile.program}</div>
              <div><span className="font-medium">Year of Study:</span> {profile.year_of_study}</div>
              <div><span className="font-medium">Phone Number:</span> {profile.phone_number}</div>
              <div><span className="font-medium">Date of Birth:</span> {profile.date_of_birth}</div>
            </div>
          </div>
        ) : (
          <div>Loading profile...</div>
        )}
      </div>
    </div>
  );
} 