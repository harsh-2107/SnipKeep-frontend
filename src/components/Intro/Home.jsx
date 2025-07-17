import { useState, useEffect } from 'react'
import Navbar from '../Navbar'
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      title: "Markdown Support",
      description: "Write and preview notes using Markdown syntax.",
    },
    {
      title: "Tags & Search",
      description: "Organize your notes with tags and find them quickly using powerful search.",
    },
    {
      title: "Encryption",
      description: "All your notes are encrypted before being stored in the database.",
    },
    {
      title: "Pin & Archive",
      description: "Pin important notes or archive them for later — just like Google Keep.",
    },
  ];

  const [index, setIndex] = useState(0);

  // Auto-change every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval); // Cleanup
  }, []);

  return (
    <>
      <Navbar />

      <section className="bg-purple-100 py-20 text-center dark:bg-gray-600 transition-colors">
        <h1 className="text-4xl font-bold text-purple-700 mb-4">Welcome to SnipKeep</h1>
        <p className="text-gray-700 max-w-xl mx-auto mb-6 dark:text-white">
          A simple and secure markdown-based note-taking app with pin, archive, and tag features. Sync your ideas across devices.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/signup" className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
            Get Started
          </Link>
          <Link to="/login" className="border border-purple-600 text-purple-600 px-6 py-2 rounded hover:bg-purple-600 hover:text-white">
            Login
          </Link>
        </div>
      </section>

      <section className="bg-white pt-10 pb-20 dark:bg-gray-800 transition-colors">
        <h2 className="text-3xl text-center font-semibold text-purple-700 mb-8">Features</h2>
        <div className="max-w-3xl mx-auto bg-purple-100 px-9 py-12 rounded-lg text-center shadow transition-all duration-500">
          <h3 className="text-xl font-bold mb-3">{features[index].title}</h3>
          <p className="text-gray-700">{features[index].description}</p>
          <div className="mt-5 flex justify-center gap-3">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === i ? "bg-purple-600" : "bg-purple-300"
                  }`}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-purple-700 text-white py-5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">© 2025 SnipKeep. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <a href="mailto:support@snipkeep.com" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Home
