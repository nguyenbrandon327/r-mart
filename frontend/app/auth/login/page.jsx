'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "../../../components/Input";
import { useAuthStore } from "../../../store";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const router = useRouter();

	const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();

	// Clear any existing errors when component mounts
	useEffect(() => {
		clearError();
	}, [clearError]);

	// Redirect if authentication state changes to true
	useEffect(() => {
		if (isAuthenticated) {
			router.push("/");
		}
	}, [isAuthenticated, router]);

	const handleLogin = async (e) => {
		e.preventDefault();
		try {
			await login(email, password);
			// No need to navigate here as the useEffect will handle it
		} catch (error) {
			// Error is already handled in the store
		}
	};

	return (
		<div className="flex flex-col md:flex-row min-h-screen w-full">
			{/* Left side with login form */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5 }}
				className='w-full md:w-1/2 bg-base-100 p-4 sm:p-6 md:p-8 flex flex-col justify-center min-h-screen md:min-h-0'
			>
				<div className="max-w-md mx-auto w-full">
					<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text'>
						Welcome Back
					</h2>

					<form onSubmit={handleLogin} className="mb-8">
						<Input
							icon={Mail}
							type='email'
							placeholder='Email Address'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>

						<Input
							icon={Lock}
							type='password'
							placeholder='Password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>

						<div className='flex items-center mb-6'>
							<Link href='/auth/forgot-password' className='text-sm text-primary hover:underline'>
								Forgot password?
							</Link>
						</div>
						{error && <p className='text-error font-semibold mb-2'>{error}</p>}

						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className='w-full py-3 px-4 btn btn-primary text-white font-bold rounded-lg'
							type='submit'
							disabled={isLoading}
						>
							{isLoading ? <Loader className='w-6 h-6 animate-spin mx-auto' /> : "Login"}
						</motion.button>
					</form>

					<div className='text-center'>
						<p className='text-sm text-base-content/70'>
							Don't have an account?{" "}
							<Link href='/auth/signup' className='text-secondary hover:underline'>
								Sign up
							</Link>
						</p>
					</div>
				</div>
			</motion.div>

			{/* Right side with image */}
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="w-full md:w-1/2 relative hidden md:block"
			>
				<div 
					className="h-full bg-cover bg-center" 
					style={{ backgroundImage: 'url("/login.jpg")' }}
				/>
			</motion.div>
		</div>
	);
};
export default LoginPage;