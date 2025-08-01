import Link from 'next/link';
import { Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
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
          <Link href="/" className="link link-hover">Homepage</Link>
          <Link href="/landing" className="link link-hover">About</Link>
          <Link href="/terms" className="link link-hover">Terms of Service</Link>
          <Link href="/privacy" className="link link-hover">Privacy Policy</Link>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4">
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="link link-hover"
            aria-label="Instagram"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a 
            href="https://linkedin.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="link link-hover"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        </div>
      </div>

      <div>
        <p className="text-base-content/50">© 2025 R'Mart - All rights reserved.</p>
      </div>
    </footer>
  );
}