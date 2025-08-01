'use client';

import { motion } from "framer-motion";
import Input from "../../../components/Input";
import { Loader, Lock, Mail, User } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";

import { useAuthStore } from "../../../store";

export default function SignUpPage() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [termsError, setTermsError] = useState("");
	const [captchaToken, setCaptchaToken] = useState("");
	const [captchaError, setCaptchaError] = useState("");
	const router = useRouter();

	const { signup, error, isLoading, isAuthenticated } = useAuthStore();

	// Redirect if authentication state changes to true
	useEffect(() => {
		if (isAuthenticated) {
			router.push("/");
		}
	}, [isAuthenticated, router]);

	const handleSignUp = async (e) => {
		e.preventDefault();

		// Clear any existing errors
		setTermsError("");
		setCaptchaError("");

		if (password !== confirmPassword) {
			alert("Passwords do not match. Please try again.");
			return;
		}

		if (!agreedToTerms) {
			setTermsError("Please agree to the Terms of Service and Privacy Policy to continue.");
			return;
		}

		if (!captchaToken) {
			setCaptchaError("Please complete the captcha verification.");
			return;
		}

		try {
			const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
			await signup({ email, password, name: fullName, captchaToken });
			router.push("/auth/verify-email");
		} catch (error) {
			console.log(error);
		}
	};

	const onCaptchaChange = (token) => {
		setCaptchaToken(token);
		setCaptchaError("");
	};
	return (
		<div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
			{/* Left side with image */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="w-full md:w-1/2 relative hidden md:block"
			>
				<div 
					className="h-full bg-cover bg-center" 
					style={{ backgroundImage: 'url("/signup.png")' }}
				/>
			</motion.div>

			{/* Right side with signup form */}
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5 }}
				className='w-full md:w-1/2 bg-base-100 p-8 flex flex-col justify-center'
			>
				<div className="max-w-md mx-auto w-full">
					<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text'>
						Create Account
					</h2>

					<form onSubmit={handleSignUp} className="mb-8">
						<div className="flex gap-3">
							<Input
								icon={User}
								type='text'
								placeholder='First Name'
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
							/>
							<Input
								icon={User}
								type='text'
								placeholder='Last Name'
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
							/>
						</div>
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
						<Input
							icon={Lock}
							type='password'
							placeholder='Confirm Password'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
						{error && <p className='text-error font-semibold mt-2'>{error}</p>}

						{/* Terms and Privacy Agreement */}
						<div className="flex items-center gap-3 mt-4">
							<input
								type="checkbox"
								id="terms-agreement"
								checked={agreedToTerms}
								onChange={(e) => {
									setAgreedToTerms(e.target.checked);
									// Clear terms error when user checks the box
									if (e.target.checked) {
										setTermsError("");
									}
								}}
								className="checkbox checkbox-primary flex-shrink-0"
							/>
							<label htmlFor="terms-agreement" className="text-sm text-base-content/70 leading-relaxed">
								I agree to the{" "}
								<Link 
									href="/terms" 
									className="text-primary hover:text-primary/80 underline font-medium"
									target="_blank"
									rel="noopener noreferrer"
								>
									Terms of Service
								</Link>
								{" "}and{" "}
								<Link 
									href="/privacy" 
									className="text-primary hover:text-primary/80 underline font-medium"
									target="_blank"
									rel="noopener noreferrer"
								>
									Privacy Policy
								</Link>
							</label>
						</div>
						{termsError && <p className='text-error font-semibold mt-2'>{termsError}</p>}

						{/* reCAPTCHA */}
						<div className="mt-4 flex justify-center">
							<ReCAPTCHA
								sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "your-site-key-here"}
								onChange={onCaptchaChange}
								theme="light"
							/>
						</div>
						{captchaError && <p className='text-error font-semibold mt-2'>{captchaError}</p>}

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

					<div className='text-center'>
						<p className='text-sm text-base-content/70'>
							Already have an account?{" "}
							<Link href="/auth/login" className='text-secondary hover:underline'>
								Login
							</Link>
						</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
};
