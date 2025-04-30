'use client';

import { motion } from "framer-motion";
import Input from "../../../components/Input";
import { Loader, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordStrengthMeter from "../../../components/PasswordStrengthMeter";
import { useAuthStore } from "../../../store";

export default function SignUpPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const router = useRouter();

	const { signup, error, isLoading } = useAuthStore();

	const handleSignUp = async (e) => {
		e.preventDefault();

		try {
			await signup(email, password, name);
			router.push("/auth/verify-email");
		} catch (error) {
			console.log(error);
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
						style={{ backgroundImage: 'url("/signup.jpg")' }}
					/>
				</div>

				{/* Right side with signup form */}
				<div className='w-full md:w-1/2 p-8'>
					<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text'>
						Create Account
					</h2>

					<form onSubmit={handleSignUp}>
						<Input
							icon={User}
							type='text'
							placeholder='Full Name'
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
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
						{error && <p className='text-error font-semibold mt-2'>{error}</p>}
						<PasswordStrengthMeter password={password} />

						<motion.button
							className='mt-5 w-full py-3 px-4 btn btn-primary text-white font-bold rounded-lg'
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							type='submit'
							disabled={isLoading}
						>
							{isLoading ? <Loader className='animate-spin mx-auto' size={24} /> : "Sign Up"}
						</motion.button>
					</form>
				</div>
			</div>
			<div className='px-8 py-4 bg-base-300 flex justify-center mt-auto'>
				<p className='text-sm text-base-content/70'>
					Already have an account?{" "}
					<Link href="/auth/login" className='text-secondary hover:underline'>
						Login
					</Link>
				</p>
			</div>
		</motion.div>
	);
};
