'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "../../../store";
import { useSelector } from 'react-redux';
import toast from "react-hot-toast";

const EmailVerificationPage = () => {
	const [code, setCode] = useState(["", "", "", "", "", ""]);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [resendLoading, setResendLoading] = useState(false);
	const inputRefs = useRef([]);
	const router = useRouter();

	const { isLoading, verifyEmail, resendVerificationCode, clearError, clearMessage } = useAuthStore();
	const { user, isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);

	// Clear any existing errors when component mounts
	useEffect(() => {
		clearError();
	}, [clearError]);

	// Access control: redirect users who shouldn't be on this page
	useEffect(() => {
		// Don't do anything while checking auth
		if (isCheckingAuth) return;

		// Redirect to login if not authenticated
		if (!isAuthenticated) {
			router.push('/auth/login');
			return;
		}

		// Redirect if user is already verified
		if (user && user.isVerified) {
			if (user.isOnboarded) {
				router.push('/');
			} else {
				router.push('/auth/onboarding');
			}
			return;
		}
	}, [isAuthenticated, user, isCheckingAuth, router]);

	const handleChange = (index, value) => {
		// Clear errors when user starts typing
		clearError();
		
		const newCode = [...code];

		// Handle pasted content
		if (value.length > 1) {
			const pastedCode = value.slice(0, 6).split("");
			for (let i = 0; i < 6; i++) {
				newCode[i] = pastedCode[i] || "";
			}
			setCode(newCode);

			// Focus on the last non-empty input or the first empty one
			const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
			const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
			inputRefs.current[focusIndex].focus();
		} else {
			newCode[index] = value;
			setCode(newCode);

			// Move focus to the next input field if value is entered
			if (value && index < 5) {
				inputRefs.current[index + 1].focus();
			}
		}
	};

	const handleKeyDown = (index, e) => {
		if (e.key === "Backspace" && !code[index] && index > 0) {
			inputRefs.current[index - 1].focus();
		}
	};

	const handleSubmit = async (e, isManualSubmit = true) => {
		e.preventDefault();
		const verificationCode = code.join("");
		try {
			const response = await verifyEmail(verificationCode);
			if (response.user && !response.user.isOnboarded) {
				router.push("/auth/onboarding");
			} else {
				router.push("/");
			}
			toast.success("Email verified successfully");
		} catch (error) {
			console.log(error);
			// Only show error toast for manual submissions
			if (isManualSubmit) {
				toast.error("Invalid or expired verification code. Please try again.");
			}
		}
	};

	// Auto submit when all fields are filled
	useEffect(() => {
		if (code.every((digit) => digit !== "")) {
			handleSubmit(new Event("submit"), false); // Pass false to indicate auto-submit
		}
	}, [code]);

	// Countdown timer for resend cooldown
	useEffect(() => {
		let interval = null;
		if (resendCooldown > 0) {
			interval = setInterval(() => {
				setResendCooldown((prevCooldown) => prevCooldown - 1);
			}, 1000);
		} else if (resendCooldown === 0) {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [resendCooldown]);

	const handleResend = async () => {
		if (resendCooldown > 0) return;
		
		setResendLoading(true);
		try {
			await resendVerificationCode();
			toast.success("Verification code sent successfully!");
			setResendCooldown(60); // 60 second cooldown
			clearMessage();
		} catch (error) {
			toast.error(error.message || "Failed to resend verification code");
		} finally {
			setResendLoading(false);
		}
	};

	// Show loading while checking auth or if user shouldn't be here
	if (isCheckingAuth || !isAuthenticated || (user && user.isVerified)) {
		return (
			<div className="flex justify-center items-center h-screen" data-theme="light">
				<div className="loading loading-spinner loading-lg"></div>
			</div>
		);
	}

	return (
		<div className='max-w-md w-full bg-base-200 rounded-2xl shadow-xl overflow-hidden'>
			<motion.div
				initial={{ opacity: 0, y: -50 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className='rounded-2xl shadow-2xl p-8 w-full max-w-md'
			>
				<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text'>
					Verify Your Email
				</h2>
				<p className='text-center text-base-content/70 mb-6'>Enter the 6-digit code sent to your email address.</p>

				<form onSubmit={handleSubmit} className='space-y-6'>
					<div className='flex justify-between'>
						{code.map((digit, index) => (
							<input
								key={index}
								ref={(el) => (inputRefs.current[index] = el)}
								type='text'
								maxLength='6'
								value={digit}
								onChange={(e) => handleChange(index, e.target.value)}
								onKeyDown={(e) => handleKeyDown(index, e)}
								className='w-12 h-12 text-center text-2xl font-bold bg-base-300 text-base-content border-2 border-base-content/20 rounded-lg focus:border-primary focus:outline-none'
							/>
						))}
					</div>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						type='submit'
						disabled={isLoading || code.some((digit) => !digit)}
						className='w-full btn btn-primary text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50'
					>
						{isLoading ? "Verifying..." : "Verify Email"}
					</motion.button>
				</form>
				
				<div className='mt-4 text-center'>
					<p className='text-sm text-base-content/70 mb-3'>
						Didn't receive the code?
					</p>
					<motion.button
						whileHover={{ scale: resendCooldown === 0 ? 1.05 : 1 }}
						whileTap={{ scale: resendCooldown === 0 ? 0.95 : 1 }}
						onClick={handleResend}
						disabled={resendCooldown > 0 || resendLoading}
						className='btn btn-outline btn-sm disabled:opacity-50'
					>
						{resendLoading ? (
							<span className="loading loading-spinner loading-sm"></span>
						) : resendCooldown > 0 ? (
							`Resend in ${resendCooldown}s`
						) : (
							"Resend Code"
						)}
					</motion.button>
				</div>
			</motion.div>
		</div>
	);
};
export default EmailVerificationPage;