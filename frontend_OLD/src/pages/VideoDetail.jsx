import { Link, useParams } from "react-router-dom";

function VideoDetail() {
  const { id } = useParams();

  // Mock data - we'll replace with API call later
  const video = {
    title: "Advanced Shooting Techniques",
    instructor: "Coach Mike",
    price: 29.99,
    description:
      "Master advanced shooting techniques including quick release, accuracy drills, and game situation shooting. This comprehensive course covers everything from basic fundamentals to advanced tactics used by professional players.",
    duration: "2 hours 15 minutes",
    thumbnail: "🥍",
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            🎬 FilmRoom
          </Link>
          <div className="space-x-4">
            <Link to="/my-library" className="text-gray-300 hover:text-white">
              My Library
            </Link>
            <Link to="/login" className="text-gray-300 hover:text-white">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div>
            <div className="bg-gray-800 rounded-lg h-96 flex items-center justify-center">
              <span className="text-9xl">{video.thumbnail}</span>
            </div>
          </div>

          {/* Video Info */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{video.title}</h1>
            <p className="text-xl text-gray-400 mb-4">by {video.instructor}</p>
            <p className="text-3xl font-bold text-blue-500 mb-6">
              ${video.price}
            </p>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Duration</h3>
              <p className="text-gray-400">{video.duration}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {video.description}
              </p>
            </div>

            <button className="w-full bg-blue-600 py-4 rounded-lg font-bold text-xl hover:bg-blue-700 transition">
              Purchase Now - ${video.price}
            </button>

            <p className="text-sm text-gray-400 mt-4 text-center">
              Secure checkout with Stripe
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VideoDetail;
