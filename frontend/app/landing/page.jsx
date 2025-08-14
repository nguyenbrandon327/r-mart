'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Search, MessageCircle, MapPin, Recycle, Shield, Heart } from 'lucide-react';
import Image from 'next/image';

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
          <div className="navbar px-4 min-h-[4rem] relative">
            {/* LEFT SECTION - LOGO */}
            <div className="flex items-center gap-1">
              <div className="flex-none">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-2">
                    <Image 
                      src="/logo-pic.png" 
                      alt="R'mart Logo" 
                      width={48}
                      height={48}
                      className="object-contain"
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

            {/* CENTER SECTION - Navigation Links */}
            <div className={`items-center gap-6 absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
              scrolled ? 'hidden lg:flex opacity-100' : 'hidden opacity-0'
            }`}>
              <a 
                href="#about" 
                className="text-base-content hover:text-primary transition-colors cursor-pointer font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                About
              </a>
              <a 
                href="#how-it-works" 
                className="text-base-content hover:text-primary transition-colors cursor-pointer font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                How It Works
              </a>
              <a 
                href="#faq" 
                className="text-base-content hover:text-primary transition-colors cursor-pointer font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                FAQ
              </a>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-4 ml-auto">
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
      <section className="hero min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 relative overflow-hidden" style={{ isolation: 'isolate' }}>
        {/* Photo Collage - Circling around hero content */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top row - circling around */}
          <div className="absolute top-16 left-[30%] transform -translate-x-1/2 bg-white p-3 pb-8 shadow-lg -rotate-12 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 2, width: 'clamp(12rem, 24vw, 20rem)', height: 'clamp(12rem, 26vw, 19rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/1.jpg" 
                alt="Campus life" 
                fill
                sizes="(max-width: 768px) 12rem, 20rem"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white p-3 pb-8 shadow-lg rotate-12 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 1, width: 'clamp(10rem, 20vw, 14rem)', height: 'clamp(14rem, 30vw, 20rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/12.jpg" 
                alt="UCR campus life" 
                fill
                sizes="(max-width: 768px) 10rem, 14rem"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute top-20 right-1/3 transform translate-x-1/2 bg-white p-3 pb-8 shadow-lg -rotate-12 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 1, width: 'clamp(11rem, 22vw, 15rem)', height: 'clamp(14rem, 32vw, 21rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/4.jpg" 
                alt="UCR students" 
                fill
                sizes="(max-width: 768px) 11rem, 15rem"
                className="object-cover"
              />
            </div>
          </div>
          
          {/* Left side */}
          <div className="absolute bottom-32 md:bottom-12 left-16 transform -translate-y-1/2 bg-white p-3 pb-6 shadow-lg rotate-6 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 3, width: 'clamp(13rem, 24vw, 21rem)', height: 'clamp(13rem, 24vw, 18rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/2.jpg" 
                alt="Student items" 
                fill
                sizes="(max-width: 768px) 13rem, 21rem"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute top-80 left-20 transform -translate-y-1/2 bg-white p-3 pb-8 shadow-lg -rotate-6 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 1, width: 'clamp(13rem, 26vw, 21rem)', height: 'clamp(12rem, 24vw, 18rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/10.jpg" 
                alt="Campus activities" 
                fill
                sizes="(max-width: 768px) 13rem, 21rem"
                className="object-cover"
              />
            </div>
          </div>
          
          {/* Right side */}
          <div className="absolute bottom-32 md:bottom-24 right-8 transform -translate-y-1/2 bg-white p-3 pb-8 shadow-lg -rotate-3 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 2, width: 'clamp(13rem, 26vw, 21rem)', height: 'clamp(11rem, 22vw, 17rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/5.jpg" 
                alt="Campus community" 
                fill
                sizes="(max-width: 768px) 13rem, 21rem"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute top-80 right-16 transform -translate-y-1/2 bg-white p-3 pb-8 shadow-lg rotate-12 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 1, width: 'clamp(12rem, 24vw, 18rem)', height: 'clamp(11rem, 22vw, 17rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/7.jpg" 
                alt="Campus community" 
                fill
                sizes="(max-width: 768px) 12rem, 18rem"
                className="object-cover"
              />
            </div>
          </div>
          
          {/* Bottom row */}
          <div className="absolute bottom-16 left-[30%] transform -translate-x-1/2 bg-white p-3 pb-8 shadow-lg -rotate-6 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 1, width: 'clamp(12rem, 24vw, 18rem)', height: 'clamp(14rem, 30vw, 20rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/3.jpg" 
                alt="Marketplace" 
                fill
                sizes="(max-width: 768px) 12rem, 18rem"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white p-3 pb-8 shadow-lg rotate-6 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300 z-[4] md:z-[1]" style={{ width: 'clamp(10rem, 20vw, 14rem)', height: 'clamp(14rem, 30vw, 20rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/11.jpg" 
                alt="Student community" 
                fill
                sizes="(max-width: 768px) 10rem, 14rem"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute bottom-20 right-[28%] transform translate-x-1/2 bg-white p-3 pb-8 shadow-lg rotate-3 scale-90 md:scale-100 hover:scale-105 transition-transform duration-300" style={{ zIndex: 1, width: 'clamp(11rem, 22vw, 16rem)', height: 'clamp(16rem, 34vw, 22rem)' }}>
            <div className="relative w-full h-full">
              <Image 
                src="/landing/6.jpg" 
                alt="Student life" 
                fill
                sizes="(max-width: 768px) 11rem, 16rem"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="hero-content text-center max-w-4xl relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-black font-gt-america-expanded mb-6 leading-tight" style={{ 
              textShadow: `
                0 1px 2px rgba(255,255,255,0.5),
                0 2px 4px rgba(255,255,255,0.3),
                1px 1px 0 rgba(255,255,255,0.4),
                -1px -1px 0 rgba(255,255,255,0.4)
              `
            }}>
              <span style={{ color: '#003da5' }}>Pass it </span>
              <span style={{ color: '#ffb81c' }}>on</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 font-medium text-white" style={{ 
              textShadow: `
                0 1px 2px rgba(0,0,0,0.5),
                0 2px 4px rgba(0,0,0,0.3),
                1px 1px 0 rgba(0,0,0,0.4),
                -1px -1px 0 rgba(0,0,0,0.4)
              `
            }}>
              Sell secondhand items in your uni community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup" className="btn btn-primary btn-lg text-lg px-8">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's R'Mart Section */}
      <section id="about" className="py-20 bg-base-200/50">
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
              <div className="relative w-full max-w-lg md:max-w-md h-80">
                <Image 
                  src="/landing/8.jpg" 
                  alt="UCR students marketplace" 
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover shadow-lg border-4 border-white"
                />
              </div>
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
      <section id="how-it-works" className="py-20 bg-base-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-base-content">
              How It Works
            </h2>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 flex justify-center lg:justify-start">
              <div className="relative w-full max-w-sm aspect-square">
                <Image 
                  src="/landing/9.png" 
                  alt="UCR students using marketplace" 
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover shadow-lg border-4 border-white"
                />
              </div>
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

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-base-200/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-base-content">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            <div className="collapse collapse-arrow bg-base-100 shadow-lg">
              <input type="radio" name="faq-accordion" defaultChecked />
              <div className="collapse-title text-xl font-medium">
                Who can join?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">
                  Current UCR undergraduate, masters, phd students, and Alumni &lt; 1 year
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100 shadow-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">
                What information is public and private?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">
                All listings are public and include the seller’s username. Profile pages are only accessible to authenticated users (i.e., other UCR students). These pages display the seller’s name, profile picture, description, year, major, and dorm name (which can be hidden if preferred).
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100 shadow-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">
                Who can I contact for help, reporting, and other inquiries?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">
                  brandon@ucrmart.com :)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
