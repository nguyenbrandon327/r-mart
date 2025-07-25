'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Search, MessageCircle, MapPin, Recycle, Shield, Heart } from 'lucide-react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-base-100/80 backdrop-blur-lg border-b border-base-content/10' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="navbar px-4 min-h-[4rem] justify-between">
            {/* LEFT SECTION - LOGO */}
            <div className="flex items-center gap-1 flex-1">
              <div className="flex-none">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/logo-pic.png" 
                      alt="R'mart Logo" 
                      className="size-12 object-contain"
                    />
                    <span
                      className="font-black font-gt-america-expanded tracking-tighter text-2xl 
                        bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                    >
                      r'mart
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-4 flex-none">
              <Link href="/auth/login" className="btn btn-ghost btn-sm rounded-none">
                Login
              </Link>
              <Link href="/auth/signup" className="btn btn-primary btn-sm rounded-none">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 relative overflow-hidden">
        {/* Photo Collage */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left side photos */}
          <img 
            src="/landing/1.jpg" 
            alt="Campus life" 
            className="absolute top-20 left-8 w-72 h-60 object-cover rounded-sm shadow-lg border-4 border-white transform -rotate-12 hover:scale-105 transition-transform duration-300"
            style={{ zIndex: 1 }}
          />
          <img 
            src="/landing/2.jpg" 
            alt="Student items" 
            className="absolute top-96 left-4 w-64 h-48 object-cover rounded-sm shadow-lg border-4 border-white transform rotate-6 hover:scale-105 transition-transform duration-300"
            style={{ zIndex: 1 }}
          />
          <img 
            src="/landing/3.jpg" 
            alt="Marketplace" 
            className="absolute bottom-32 left-12 w-56 h-64 object-cover rounded-sm shadow-lg border-4 border-white transform -rotate-6 hover:scale-105 transition-transform duration-300"
            style={{ zIndex: 1 }}
          />
          
          {/* Right side photos */}
          <img 
            src="/landing/4.jpg" 
            alt="UCR students" 
            className="absolute top-32 right-6 w-40 h-52 object-cover rounded-sm shadow-lg border-4 border-white transform rotate-12 hover:scale-105 transition-transform duration-300"
            style={{ zIndex: 1 }}
          />
          <img 
            src="/landing/5.jpg" 
            alt="Campus community" 
            className="absolute top-80 right-12 w-60 h-40 object-cover rounded-sm shadow-lg border-4 border-white transform -rotate-3 hover:scale-105 transition-transform duration-300"
            style={{ zIndex: 1 }}
          />
          <img 
            src="/landing/7.jpg" 
            alt="Campus community" 
            className="absolute bottom-80 right-6 w-48 h-40 object-cover rounded-sm shadow-lg border-4 border-white transform rotate-12 hover:scale-105 transition-transform duration-300"
            style={{ zIndex: 1 }}
          />
          <img 
            src="/landing/6.jpg" 
            alt="Student life" 
            className="absolute bottom-24 right-8 w-44 h-56 object-cover rounded-sm shadow-lg border-4 border-white transform rotate-8 hover:scale-105 transition-transform duration-300"
            style={{ zIndex: 1 }}
          />
        </div>

        <div className="hero-content text-center max-w-4xl relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-black font-gt-america-expanded mb-6 leading-tight">
              <span style={{ color: '#003da5' }}>Pass it </span>
              <span style={{ color: '#ffb81c' }}>on</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-base-content/80 font-medium">
              Sell secondhand items in your uni community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup" className="btn btn-primary btn-lg text-lg px-8">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/all-products" className="btn btn-outline btn-lg text-lg px-8">
                Browse Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's R'Mart Section */}
      <section className="py-20 bg-base-200/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-base-content">
              What's R'Mart?
            </h2>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
            <div className="flex-1">
              <p className="text-lg md:text-xl text-base-content/80 leading-relaxed">
                R'Mart is UCR's exclusive student marketplace that enables you to exchange pre-loved goods 
                within a trusted, verified community. We're fostering sustainability and encouraging a 
                circular economy right here on campus - giving more life to your unused items.
              </p>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end">
              <img 
                src="/landing/8.jpg" 
                alt="UCR students marketplace" 
                className="w-full max-w-md h-80 object-cover shadow-lg border-4 border-white"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="card-title text-xl justify-center">Verified Community</h3>
                <p className="text-base-content/70">
                  Only UCR students can join, ensuring a safe and trusted environment for all transactions.
                </p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body text-center">
                <Recycle className="w-12 h-12 mx-auto mb-4 text-secondary" />
                <h3 className="card-title text-xl justify-center">Sustainable Living</h3>
                <p className="text-base-content/70">
                  Give items a second life and reduce waste while saving money on the things you need.
                </p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="card-title text-xl justify-center">Campus Community</h3>
                <p className="text-base-content/70">
                  Connect with fellow Highlanders and build relationships that extend beyond transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-base-content">
              How It Works
            </h2>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 flex justify-center lg:justify-start">
              <img 
                src="/landing/9.jpg" 
                alt="UCR students using marketplace" 
                className="w-full max-w-sm aspect-square object-cover shadow-lg border-4 border-white"
              />
            </div>
            <div className="flex-1">
              <div className="text-lg md:text-xl text-base-content/80 leading-relaxed space-y-4">
                <p><strong>1. Sign Up:</strong> Verify your ucr.edu email to join our campus market.</p>
                <p><strong>2. List or Browse:</strong> Post items or explore categories tailored to students.</p>
                <p><strong>3. Connect & Chat:</strong> Message sellers or buyers directly to ask questions.</p>
                <p><strong>4. Meet & Complete:</strong> Meet up safely on-campus or at other convenient locations to complete the transaction.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Now Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-base-content">
            Ready to Join the Community?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-base-content/80 max-w-2xl mx-auto">
            Start buying and selling with your fellow UCR students today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup" className="btn btn-primary btn-lg text-lg px-8">
              Join R'Mart Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/all-products" className="btn btn-outline btn-lg text-lg px-8">
              See What's Available
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img 
              src="/logo-pic.png" 
              alt="R'mart Logo" 
              className="size-10 object-contain"
            />
            <span className="font-black font-gt-america-expanded tracking-tighter text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              r'mart
            </span>
          </div>
          <p className="text-base-content/70">
            UCR's student-exclusive marketplace - built by students, for students.
          </p>
        </div>
        <div>
          <div className="grid grid-flow-col gap-4">
            <Link href="/auth/login" className="link link-hover">Login</Link>
            <Link href="/auth/signup" className="link link-hover">Sign Up</Link>
            <Link href="/all-products" className="link link-hover">Browse</Link>
          </div>
        </div>
        <div>
          <p className="text-base-content/50">© 2024 R'Mart - All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
