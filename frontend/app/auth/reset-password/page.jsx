'use client';

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Lock, Loader, CheckCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Input from "../../../components/Input";
import { useAuthStore } from "../../../store/hooks";

const ResetPasswordContent = () => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [validationError, setValidationError] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);
	
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");
	
	const { resetPassword, error, isLoading, message } = useAuthStore();

	// Redirect if token is missing
	useEffect(() => {
		if (!token) {
			toast.error("Invalid or missing reset token");
			router.push("/auth/forgot-password");
		}
	}, [token, router]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setValidationError("");

		if (password !== confirmPassword) {
			setValidationError("Passwords do not match");
			return;
		}
		
		if (password.length < 6) {
			setValidationError("Password must be at least 6 characters long");
			return;
		}
		
		try {
			await resetPassword(token, password);
			setIsSuccess(true);
			toast.success("Password reset successfully");
			
			// Redirect to login after 2 seconds
			setTimeout(() => {
				router.push("/auth/login");
			}, 2000);
		} catch (err) {
			// Error is handled in the store
			toast.error(error || "Error resetting password");
		}
	};

	if (isSuccess) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className='max-w-md w-full bg-base-200 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
			>
				<div className='p-8 text-center'>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
						className='w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4'
					>
						<CheckCircle className='h-8 w-8 text-white' />
					</motion.div>
					<h2 className='text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text'>
						Password Reset
					</h2>
					<p className='text-base-content/70 mb-6'>
						Your password has been successfully reset. You will be redirected to the login page.
					</p>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='max-w-md w-full bg-base-200 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
		>
			<div className='p-8'>
				<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text'>
					Reset Password
				</h2>
				
				{error && <p className='text-error font-semibold mb-4'>{error}</p>}
				{validationError && <p className='text-error font-semibold mb-4'>{validationError}</p>}
				{message && <p className='text-success mb-4'>{message}</p>}

				<form onSubmit={handleSubmit}>
					<Input
						icon={Lock}
						type='password'
						placeholder='New Password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>

					<Input
						icon={Lock}
						type='password'
						placeholder='Confirm New Password'
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
					/>

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className='w-full py-3 px-4 btn btn-primary text-white font-bold rounded-lg'
						type='submit'
						disabled={isLoading}
					>
						{isLoading ? <Loader className='size-6 animate-spin mx-auto' /> : "Set New Password"}
					</motion.button>
				</form>
			</div>
		</motion.div>
	);
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className='flex justify-center items-center h-64'><span className='loading loading-spinner loading-lg'></span></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}