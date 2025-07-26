import { Link } from 'react-router-dom';
import { useDarkMode } from '../../context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faCode, faTags, faThumbtack } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../Navbar';
import Footer from '../Footer';

const Home = () => {
  const { darkMode } = useDarkMode();
  const features = [
    {
      title: "Markdown Support",
      icon: faCode,
      description: "Write and preview beautifully styled notes using Markdown syntax.",
    },
    {
      title: "Labels & Search",
      icon: faTags,
      description: "Organize notes with labels and find them instantly using powerful search.",
    },
    {
      title: "Encryption",
      icon: faShieldAlt,
      description: "Your notes are fully encrypted before storage, keeping your data private.",
    },
    {
      title: "Pin & Archive",
      icon: faThumbtack,
      description: "Pin important notes or archive them for later, keeping your workspace organized.",
    },
  ];

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-purple-100 dark:bg-purple-900 py-20 px-6 text-center transition-colors">
        <h1 className="text-5xl font-extrabold text-purple-700 dark:text-purple-200 mb-6">
          Welcome to SnipKeep
        </h1>
        <p className="text-gray-800 dark:text-gray-100 text-lg max-w-2xl mx-auto mb-8">
          The ultimate markdown-based note app. Secure. Simple. Snappy. Take notes the smarter way.
        </p>
        <div className="flex justify-center gap-5">
          <Link to="/signup" className="bg-purple-600 text-white px-6 py-2 text-lg rounded-full hover:bg-purple-700 transition">Get Started</Link>
          <Link to="/login" className="border border-purple-600 text-purple-700 dark:text-white px-6 py-2 text-lg rounded-full hover:bg-purple-600 hover:text-white transition">
            Login
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 bg-white dark:bg-transparent transition-colors">
        <h2 className="text-3xl font-bold text-center text-purple-700 dark:text-purple-300 mb-12">
          Features at a Glance
        </h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <div key={i}
              className="bg-purple-50 dark:bg-purple-800 rounded-xl p-6 text-center shadow hover:shadow-lg transition-all duration-300">
              <FontAwesomeIcon icon={feature.icon} className="text-3xl text-purple-600 dark:text-purple-200 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-2">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Markdown Preview Section */}
      <section className="bg-purple-100 dark:bg-purple-800 py-16 px-6 transition-colors">
        <h2 className="text-3xl font-bold text-center text-purple-800 dark:text-purple-100 mb-8">
          Real-Time Markdown Preview
        </h2>
        <p className="text-center text-gray-700 dark:text-gray-200 max-w-xl mx-auto mb-10">
          See your markdown come to life as you type. Tables, checklists, headings — rendered instantly.
        </p>
        <div className="max-w-4xl mx-auto rounded-lg overflow-hidden shadow-md border border-purple-300 dark:border-purple-600">
          <img
            src={`${darkMode ? "../../../dark-theme-demo.png" : "../../../light-theme-demo.png"}`}
            alt="Markdown Preview"
            className="w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* Why SnipKeep Section */}
      <section className="py-20 px-6 bg-white dark:bg-transparent transition-colors">
        <h2 className="text-3xl font-bold text-center text-purple-700 dark:text-purple-300 mb-8">
          Why SnipKeep?
        </h2>
        <p className="text-center text-gray-800 dark:text-gray-200 max-w-2xl mx-auto text-lg">
          Unlike other apps, SnipKeep encrypts your content before storing it in the cloud. It supports GitHub-flavored markdown like tables and task lists, and provides a clean, distraction-free interface.
        </p>
      </section>

      <Footer />
    </>
  );
};

export default Home;