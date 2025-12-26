import { Link, useParams } from "react-router-dom";

function Watch() {
  const { id } = useParams();

  // Mock data
  const video = {
    title: "Advanced Shooting Techniques",
    instructor: "Coach Mike",
    chapters: [
      { time: "00:00", title: "Introduction" },
      { time: "05:35", title: "Grip and Stance" },
      { time: "12:45", title: "Quick Release Technique" },
      { time: "25:10", title: "Accuracy Drills" },
      { time: "40:00", title: "Game Situations" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            🎬 FilmRoom
          </Link>
          <Link to="/my-library" className="text-gray-300 hover:text-white">
            ← Back to Library
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
        <p className="text-gray-400 mb-6">by {video.instructor}</p>

        {/* Video Player */}
        <div className="bg-gray-800 rounded-lg mb-8">
          <div className="aspect-video bg-gray-700 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">▶️</div>
              <p className="text-xl text-gray-400">Video Player</p>
              <p className="text-sm text-gray-500">
                (Will integrate real player here)
              </p>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Chapters</h2>
          <div className="space-y-3">
            {video.chapters.map((chapter, index) => (
              <button
                key={index}
                className="w-full text-left p-4 bg-gray-700 rounded hover:bg-gray-600 transition flex items-center"
              >
                <span className="text-blue-500 font-mono mr-4">
                  {chapter.time}
                </span>
                <span>{chapter.title}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Watch;
