const Input = ({ icon: Icon, ...props }) => {
	return (
		<div className='relative mb-6'>
			<div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
				<Icon className='size-5 text-primary' />
			</div>
			<input
				{...props}
				className='w-full pl-10 pr-3 py-2 bg-base-200 rounded-lg border border-base-300 focus:border-primary focus:ring-2 focus:ring-primary text-base-content placeholder-base-content/50 transition duration-200'
			/>
		</div>
	);
};
export default Input;