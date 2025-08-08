import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ icon: Icon, type, ...props }) => {
	const [showPassword, setShowPassword] = useState(false);
	const isPasswordField = type === 'password';
	
	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<div className='relative mb-6'>
			<div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
				<Icon className='size-5 text-primary' />
			</div>
			<input
				{...props}
				type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
				className={`w-full pl-10 ${isPasswordField ? 'pr-10' : 'pr-3'} py-2 bg-base-200 rounded-lg border border-base-300 focus:border-primary focus:ring-2 focus:ring-primary text-base-content placeholder-base-content/50 transition duration-200`}
			/>
			{isPasswordField && (
				<button
					type="button"
					onClick={togglePasswordVisibility}
					className='absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/60 hover:text-base-content transition-colors'
				>
					{showPassword ? (
						<EyeOff className='size-5' />
					) : (
						<Eye className='size-5' />
					)}
				</button>
			)}
		</div>
	);
};
export default Input;