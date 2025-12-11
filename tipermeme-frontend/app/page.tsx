import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white"> TipPerMeme</h1>
        <ConnectButton />
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Support Creators,<br />One Meme at a Time
        </h2>
        
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Pay only for memes you love. Tips arrive instantly with X402 payments.
          No subscriptions, no followers needed.
        </p>

        <div className="flex gap-4 justify-center">
          <Link 
            href="/feed"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
          >
             Explore Memes
          </Link>
          
          <Link 
            href="/upload"
            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
          >
             Upload Meme
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">$0.10</div>
            <div className="text-slate-400">Per Tip</div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">0.2s</div>
            <div className="text-slate-400">Payment Time</div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">95%</div>
            <div className="text-slate-400">Goes to Creator</div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto text-left">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Microtips Work</h3>
            <p className="text-slate-400">
              Pay as little as $0.05 per meme. Near-zero fees make it possible.
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Payouts</h3>
            <p className="text-slate-400">
              Creators get paid in 200ms. No waiting, no thresholds, no hassle.
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">No Audience Needed</h3>
            <p className="text-slate-400">
              Earn from your first post. Quality content pays immediately.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-slate-700">
        <div className="text-center text-slate-400">
          <p>Built with X402 Protocol on Base </p>
          <p className="mt-2 text-sm">Powered by instant blockchain payments</p>
        </div>
      </footer>
    </div>
  );
}