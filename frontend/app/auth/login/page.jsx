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

	const { login, isLoading, error, isAuthenticated } = useAuthStore();

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
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='flex flex-col max-w-4xl w-full bg-base-200 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
		>
			<div className="flex flex-col md:flex-row">
				{/* Left side with image */}
				<div className="w-full md:w-1/2 relative hidden md:block">
					<div 
						className="h-full bg-cover bg-center" 
						style={{ backgroundImage: 'url("/login.jpg")' }}
					/>
				</div>

				{/* Right side with login form */}
				<div className='w-full md:w-1/2 p-8'>
					<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text'>
						Welcome Back
					</h2>

					<form onSubmit={handleLogin}>
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
				</div>
			</div>
			<div className='px-8 py-4 bg-base-300 flex justify-center mt-auto'>
				<p className='text-sm text-base-content/70'>
					Don't have an account?{" "}
					<Link href='/auth/signup' className='text-secondary hover:underline'>
						Sign up
					</Link>
				</p>
			</div>
		</motion.div>
	);
};
export default LoginPage;