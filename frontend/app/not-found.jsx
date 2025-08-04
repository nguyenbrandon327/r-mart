import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 404 Error Display */}
        <div className="mb-8">
          <h1 className="text-9xl font-black font-gt-america-expanded text-transparent bg-gradient-to-r from-[#003DA5] to-[#FFB81C] bg-clip-text">
            404
          </h1>
          <div className="mt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Page not found
            </h2>
            <p className="text-gray-600 text-lg">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="space-y-4">
          {/* Primary CTA - Browse Products */}
          <Link 
            href="/all-products"
            className="block w-full px-6 py-3 bg-gradient-to-r from-[#FFB81C] to-[#FFD700] text-white font-black font-gt-america-expanded tracking-tighter text-base hover:from-[#E6A600] hover:to-[#FFCC00] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{ borderRadius: '0px' }}
          >
            BROWSE ALL LISTINGS
          </Link>

          {/* Secondary Actions */}
          <div className="flex justify-center">
            <Link 
              href="/"
              className="px-6 py-2 bg-[#003DA5] text-white font-semibold hover:bg-[#002d7a] transition-colors duration-200 text-center"
              style={{ borderRadius: '0px' }}
            >
              Go Home
            </Link>
          </div>
        </div>


      </div>
    </div>
  );
}