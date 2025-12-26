import { Link } from "react-router-dom";

function MyLibrary() {
  // Mock data - we'll replace with API call later
  const purchasedVideos = [
    {
      id: 1,
      title: "Advanced Shooting",
      instructor: "Coach Mike",
      thumbnail: "🥍",
    },
    {
      id: 2,
      title: "Defense Fundamentals",
      instructor: "Coach Sarah",
      thumbnail: "🥍",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            🎬 FilmRoom
          </Link>
          <div className="space-x-4">
            <Link to="/my-library" className="text-blue-500 font-semibold">
              My Library
            </Link>
            <button className="text-gray-300 hover:text-white">Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Library</h1>

        {purchasedVideos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-400 mb-4">No videos yet</p>
            <Link to="/" className="text-blue-500 hover:text-blue-400">
              Browse videos to get started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {purchasedVideos.map((video) => (
              <Link
                key={video.id}
                to={`/watch/${video.id}`}
                className="bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition"
              >
                <div className="h-48 bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl">{video.thumbnail}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{video.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {video.instructor}
                  </p>
                  <button className="w-full bg-green-600 py-2 rounded hover:bg-green-700">
                    ▶ Watch Now
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyLibrary;
