"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import useAuthModel from "@/hooks/useAuthModel";
import { Button } from "@/components/atoms/Button/Button";

const AuthModel = () => {
  const { login, loading, error } = useAuthModel();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [load, setLoad] = useState<boolean>(true);
  const router = useRouter();
  const savedToken = Cookies.get("auth_token");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  useEffect(() => {
    if (savedToken) {
      router.push("/dashboard");
    } else {
      setLoad(false);
    }
  }, [router, savedToken]);

  if (load) return null;

  return (
    <>
      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12">
        <div className="mb-8">
          <div
            onClick={() => router.push("/")}
            className="cursor-pointer w-fit"
          >
            <Image
              src="/images/logo/excelpro_logo_2.png"
              alt="Excel Pro Logo"
              width={60}
              height={60}
              className="mb-8"
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Login to dashboard
          </h1>
          <p className="text-gray-600">
            Please login to continue to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm text-gray-500 mb-1"
            >
              username
            </label>
            <input
              id="username"
              type="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>

          <div className="mb-2">
            <label
              htmlFor="password"
              className="block text-sm text-gray-500 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="3752572hg5"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {showPassword ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7A9.97 9.97 0 014.02 8.971m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  )}
                  {!showPassword && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-md my-4">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        {error && (
          <div className="mt-4 text-primary text-center font-bold">{error}</div>
        )}
      </div>

      {/* Right side - Image */}
      <div className="hidden md:block md:w-1/2 relative">
        <div className="h-full relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-900 opacity-80"></div>
          <Image
            src="/images/billboard/login_billboard.png"
            alt="Soccer Academy"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </>
  );
};

export default AuthModel;
