import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user } = useAuth();

  const videos = [
    {
      id: 1,
      title: "Elite Goalie Fundamentals",
      description:
        "Master the art of goaltending with professional techniques from Liam...",
      instructor: { name: "Liam Eneman", title: "Pro Athlete" },
      price: 60,
      duration: "45 min",
      category: "goalies",
      thumbnail:
        "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "Attack Mastery: Dodging & Shooting",
      description:
        "Elevate your attack game with Xander Dixon's comprehensive training on...",
      instructor: { name: "Xander Dixon", title: "Pro Athlete" },
      price: 60,
      duration: "50 min",
      category: "offense",
      thumbnail:
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: "Faceoff Domination Techniques",
      description:
        "Learn winning faceoff strategies from Mike Sissleberger. Master clamps, rakes...",
      instructor: { name: "Mike Sissleberger", title: "Pro Athlete" },
      price: 60,
      duration: "40 min",
      category: "faceoffs",
      thumbnail:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="text-xl font-bold text-white tracking-tight"
            >
              FILMROOM
            </Link>

            {/* Nav Links */}
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Home</span>
              </Link>

              <Link
                to="/"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Videos</span>
              </Link>

              <Link
                to="/my-library"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>Library</span>
              </Link>

              {user ? (
                <div className="flex items-center space-x-2 text-white">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>{user.name}</span>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-500/30">
            <span className="text-blue-400 text-sm font-medium">
              📈 Trusted by 10,000+ Players
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Master{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Lacrosse
            </span>
            <br />
            Like a Pro
          </h1>
          <p className="text-xl text-slate-300 mb-4 max-w-3xl mx-auto">
            Learn from elite professional players with our premium video
            training library.
          </p>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Elevate your game with techniques that win championships.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 rounded-lg text-white font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Start Training</span>
          </Link>
        </div>
      </section>

      {/* Featured Training */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Featured Training
            </h2>
            <p className="text-slate-400">Handpicked by our coaching staff</p>
          </div>
          <button className="px-6 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition">
            View All Videos
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Link
              key={video.id}
              to={`/video/${video.id}`}
              className="group bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden bg-slate-700">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                    {video.category}
                  </span>
                </div>

                {/* Duration */}
                <div className="absolute bottom-3 left-3 flex items-center space-x-1 text-white text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{video.duration}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition line-clamp-1">
                  {video.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {video.description}
                </p>

                {/* Instructor */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {video.instructor.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {video.instructor.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center space-x-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                      <span>{video.instructor.title}</span>
                    </p>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">
                    ${video.price}
                  </span>
                  <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-semibold transition">
                    View Details
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
